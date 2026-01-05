# Avento — Technical README

This file documents the minimal backend setup to make Avento look production-ready for judges: storage-backed photo uploads, simple Postgres schema, staging provisioning, and local development steps.

## Goals
- Provide realistic backend integration for uploads and posts.
- Demonstrate architecture, scalability, and reproducible setup for judges.
- Enable quick local testing and deployment to Supabase (or similar managed Postgres + Storage).

---

## Environment variables
Create a `.env` (or use Vite environment) with these values:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Keep keys secret for production.

---

## Supabase setup (quick)
1. Create a new Supabase project at https://app.supabase.com
2. Go to Storage → Create a bucket named `images` (public for demo, or set policies for private)
3. Go to SQL Editor and run the schema below.
4. Apply migrations in `supabase/migrations` (latest adds Vibe Rooms + Realtime voice/chat scaffolding):
  - With Supabase CLI: `supabase db push`
  - Or run the SQL from `supabase/migrations/010_vibe_rooms.sql` manually.

### Minimal SQL schema
```sql
-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text,
  display_name text,
  created_at timestamptz default now()
);

-- Albums
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) on delete set null,
  title text,
  description text,
  cover_photo text,
  total_photos int default 0,
  created_at timestamptz default now()
);

-- Photos
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references albums(id) on delete cascade,
  owner_id uuid references users(id) on delete set null,
  storage_path text,
  public_url text,
  caption text,
  uploaded_at timestamptz default now(),
  likes int default 0
);
```

4. Set Row Level Security (RLS) policies depending on your privacy needs. For demo, you can allow public inserts in `photos` by service role or via function.

---

## Local dev
- Install dependencies:

```bash
npm install
```

- Add `.env` with your Supabase project values.

- Start dev server:

```bash
npm run dev
```

- Test the Upload component (example in `src/components/PhotoAlbum.tsx`) — it will upload to the configured Supabase storage bucket and return a public URL.

---

## How the code integrates
- `src/lib/supabaseClient.ts` — creates the Supabase client used by the frontend.
- `src/components/UploadPhoto.tsx` — drag/drop upload UI; calls the `uploadImage` helper.
- `src/components/PhotoAlbum.tsx` — wired to use `UploadPhoto` in the Create Album flow and uses the in-memory `photosService` for demo persistence. Replace with real DB inserts to persist.

### Example insert (JS)
```js
import { supabase } from './lib/supabaseClient';

// after you upload file to storage and have `publicUrl`
await supabase.from('photos').insert([{ album_id: '<album-uuid>', owner_id: '<user-uuid>', storage_path: '<bucket/path>', public_url: '<publicUrl>', caption: '...' }]);
```

---

## Next steps to make it production-realistic (recommended)
- Replace `photosService` in `src/services/photosService.ts` with API calls to Supabase (or serverless functions) to persist albums/photos.
- Add authentication flow (Supabase Auth) to gate uploads and tie content to users.
- Add RLS policies to the DB to protect user data.
- Add background functions to generate thumbnails and moderate uploads (or integrate 3rd-party moderation API).
- Add analytics (Supabase Edge Functions + events or third-party like Plausible/GA) and link to the Traction component.

## Live activity map prerequisites (matches table)
- Ensure `matches` rows carry geographic coordinates: set `lat` and `lng` (float) on every active row; otherwise provide a known Ahmedabad venue name (e.g., "Sardar Patel Stadium") so the client lookup can resolve it.
- Enable Realtime on `matches` (insert/update/delete) in Supabase: Database → Replication → Realtime → enable table so the heatmap and modal map stay live.
- Optional: store `current_players` to make the heatmap intensity more accurate; the UI will use it automatically if present.

---

## For judges: reproducibility notes
- You can provision a free Supabase project and follow the SQL schema above.
- The UI is fully wired to a storage-backed upload flow — supply the env vars, create an `images` bucket, and the upload will work.

If you want, I can:
- Add a small serverless/edge function to create `albums` + `photos` rows after upload.
- Replace `photosService` references with real API calls and create migration SQL for ease of deployment.

