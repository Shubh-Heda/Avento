begin;

set search_path = public;

-- =====================================================
-- Nearby plan broadcast (sports/events/parties/gaming)
-- Fan out to everyone within ~20km after payment confirm
-- =====================================================

create or replace function haversine_km(
	lat1 double precision,
	lon1 double precision,
	lat2 double precision,
	lon2 double precision
) returns double precision
language sql
immutable
as $$
	select 2 * 6371 * asin(
		sqrt(
			power(sin(radians(lat2 - lat1) / 2), 2) +
			cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
		)
	);
$$;

-- Last known user location (inputs already captured on client)
create table if not exists user_locations (
	user_id uuid primary key,
	lat double precision not null,
	lng double precision not null,
	updated_at timestamptz default now()
);

create index if not exists idx_user_locations_lat_lng on user_locations(lat, lng);

-- Broadcast envelope
create table if not exists plan_broadcasts (
	id uuid primary key default gen_random_uuid(),
	plan_id uuid not null,
	category text not null check (category in ('sports','events','parties','gaming')),
	creator_id uuid not null,
	lat double precision not null,
	lng double precision not null,
	radius_km double precision not null default 20 check (radius_km > 0),
	created_at timestamptz default now()
);

create index if not exists idx_plan_broadcasts_category on plan_broadcasts(category);
create index if not exists idx_plan_broadcasts_creator on plan_broadcasts(creator_id);

-- Recipients for push/feed/map fan-out
create table if not exists plan_broadcast_recipients (
	broadcast_id uuid references plan_broadcasts(id) on delete cascade,
	user_id uuid not null,
	distance_km double precision not null,
	notified_at timestamptz default now(),
	primary key (broadcast_id, user_id)
);

create index if not exists idx_plan_broadcast_recipients_user on plan_broadcast_recipients(user_id);

-- RPC: call after 5-step payment confirmation
create or replace function broadcast_plan(
	p_plan_id uuid,
	p_creator_id uuid,
	p_category text,
	p_lat double precision,
	p_lng double precision,
	p_radius_km double precision default 20
) returns table(broadcast_id uuid, recipients int)
language plpgsql
security definer
set search_path = public
as $$
declare
	bid uuid;
begin
	if p_category not in ('sports','events','parties','gaming') then
		raise exception 'Invalid category %', p_category;
	end if;

	insert into plan_broadcasts(plan_id, category, creator_id, lat, lng, radius_km)
	values (p_plan_id, p_category, p_creator_id, p_lat, p_lng, coalesce(p_radius_km, 20))
	returning id into bid;

	insert into plan_broadcast_recipients (broadcast_id, user_id, distance_km)
	select bid, ul.user_id, haversine_km(p_lat, p_lng, ul.lat, ul.lng)
	from user_locations ul
	where haversine_km(p_lat, p_lng, ul.lat, ul.lng) <= coalesce(p_radius_km, 20)
		and ul.user_id <> p_creator_id
	on conflict (broadcast_id, user_id) do nothing;

	return query
	select bid, count(*)::int
	from plan_broadcast_recipients
	where broadcast_id = bid;
end;
$$;

comment on function broadcast_plan is 'Call after payment confirmation to fan out a plan to users within radius_km (~20km default) via push/feed/map layers.';

-- Realtime publication for downstream subscribers (map/feed listeners)
do $$
begin
	if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
		if not exists (
			select 1 from pg_publication_tables
			where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'plan_broadcasts'
		) then
			alter publication supabase_realtime add table public.plan_broadcasts;
		end if;

		if not exists (
			select 1 from pg_publication_tables
			where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'plan_broadcast_recipients'
		) then
			alter publication supabase_realtime add table public.plan_broadcast_recipients;
		end if;
	end if;
end$$;

commit;

