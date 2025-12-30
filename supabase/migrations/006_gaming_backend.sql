-- ============================================
-- Gaming Hub Backend Migration
-- Complete gaming sessions, clubs, tournaments, and player management
-- ============================================

-- ============================================
-- GAMING CLUBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gaming_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_km DECIMAL(10, 2),
  rating DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  description TEXT,
  consoles TEXT[] DEFAULT '{}', -- PS5, Xbox Series X, Gaming PC, VR, Nintendo Switch
  hourly_rate DECIMAL(10, 2) NOT NULL,
  facilities TEXT[] DEFAULT '{}', -- Food & Drinks, Streaming Setup, Private Rooms, AC, WiFi
  games_library TEXT[] DEFAULT '{}',
  open_time TIME NOT NULL DEFAULT '10:00:00',
  close_time TIME NOT NULL DEFAULT '23:00:00',
  total_seats INTEGER NOT NULL DEFAULT 20,
  private_rooms INTEGER DEFAULT 0,
  streaming_setups INTEGER DEFAULT 0,
  has_food BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMING SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES gaming_clubs(id) ON DELETE CASCADE,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 2 CHECK (duration_hours > 0),
  game_specific BOOLEAN DEFAULT true,
  game_name TEXT, -- FIFA 24, COD: MW3, Valorant, etc.
  platform TEXT NOT NULL, -- PS5, Xbox Series X, Gaming PC, VR
  session_type TEXT NOT NULL CHECK (session_type IN ('casual', 'competitive', 'tournament', 'practice')),
  skill_level TEXT NOT NULL DEFAULT 'any' CHECK (skill_level IN ('beginner', 'intermediate', 'pro', 'any')),
  min_players INTEGER DEFAULT 2,
  max_players INTEGER NOT NULL DEFAULT 8,
  current_players INTEGER DEFAULT 1,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'friends-only', 'private')),
  payment_mode TEXT NOT NULL DEFAULT '5-stage' CHECK (payment_mode IN ('5-stage', 'instant', 'free')),
  price_per_person DECIMAL(10, 2) DEFAULT 0.0,
  seat_type TEXT DEFAULT 'individual' CHECK (seat_type IN ('individual', 'private-room')),
  streaming_available BOOLEAN DEFAULT false,
  has_food BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'soft-lock', 'payment-window', 'hard-lock', 'confirmed', 'ongoing', 'completed', 'cancelled')),
  payment_window_end TIMESTAMPTZ,
  current_stage INTEGER DEFAULT 1 CHECK (current_stage >= 1 AND current_stage <= 5),
  requirements TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMING SESSION PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gaming_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES gaming_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'player' CHECK (role IN ('host', 'player', 'spectator')),
  skill_level TEXT,
  favorite_games TEXT[] DEFAULT '{}',
  games_played INTEGER DEFAULT 0,
  has_paid BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_id TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  rating_given INTEGER CHECK (rating_given >= 1 AND rating_given <= 5),
  review TEXT,
  UNIQUE(session_id, user_id)
);

-- ============================================
-- GAMING TOURNAMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gaming_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  game TEXT NOT NULL, -- FIFA 24, Valorant, etc.
  club_id UUID REFERENCES gaming_clubs(id) ON DELETE SET NULL,
  organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  registration_start TIMESTAMPTZ DEFAULT NOW(),
  registration_end TIMESTAMPTZ NOT NULL,
  registration_fee DECIMAL(10, 2) DEFAULT 0.0,
  prize_pool DECIMAL(10, 2) DEFAULT 0.0,
  prize_distribution JSONB, -- {1st: 50000, 2nd: 30000, 3rd: 20000}
  max_teams INTEGER NOT NULL,
  current_teams INTEGER DEFAULT 0,
  format TEXT NOT NULL CHECK (format IN ('single-elimination', 'double-elimination', 'round-robin', 'swiss')),
  team_size INTEGER NOT NULL DEFAULT 1,
  platform TEXT NOT NULL,
  rules TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'registration' CHECK (status IN ('registration', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  is_verified BOOLEAN DEFAULT false,
  sponsor_name TEXT,
  sponsor_logo TEXT,
  stream_url TEXT,
  bracket_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TOURNAMENT TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES gaming_tournaments(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  captain_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'rejected', 'withdrawn')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  seed_number INTEGER,
  current_round INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  eliminated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, team_name)
);

-- ============================================
-- TOURNAMENT TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES tournament_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'player' CHECK (role IN ('captain', 'player', 'substitute')),
  in_game_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- ============================================
-- GAMING CLUB REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gaming_club_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES gaming_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  ambience_rating INTEGER CHECK (ambience_rating >= 1 AND ambience_rating <= 5),
  equipment_rating INTEGER CHECK (equipment_rating >= 1 AND equipment_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  would_recommend BOOLEAN DEFAULT true,
  visited_date DATE,
  images TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- ============================================
-- GAMING ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gaming_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_title TEXT NOT NULL,
  achievement_description TEXT,
  icon TEXT,
  coins_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  target INTEGER DEFAULT 100,
  is_unlocked BOOLEAN DEFAULT true,
  metadata JSONB
);

-- ============================================
-- USER GAMING STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_gaming_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  trust_score DECIMAL(3, 2) DEFAULT 4.5,
  friendship_streak INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0.0,
  total_achievements INTEGER DEFAULT 0,
  coins_balance INTEGER DEFAULT 0,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  hours_played INTEGER DEFAULT 0,
  friends_made INTEGER DEFAULT 0,
  sessions_hosted INTEGER DEFAULT 0,
  sessions_attended INTEGER DEFAULT 0,
  tournaments_entered INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  favorite_game TEXT,
  favorite_platform TEXT,
  preferred_skill_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMING FRIENDSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gaming_friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  games_played_together INTEGER DEFAULT 0,
  friendship_score DECIMAL(5, 2) DEFAULT 0.0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gaming_clubs_location ON gaming_clubs(city, state);
CREATE INDEX IF NOT EXISTS idx_gaming_clubs_rating ON gaming_clubs(rating DESC);
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_club_id ON gaming_sessions(club_id);
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_host_id ON gaming_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_date ON gaming_sessions(date, time);
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_status ON gaming_sessions(status);
CREATE INDEX IF NOT EXISTS idx_gaming_sessions_game ON gaming_sessions(game_name);
CREATE INDEX IF NOT EXISTS idx_gaming_session_participants_session_id ON gaming_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_gaming_session_participants_user_id ON gaming_session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_gaming_tournaments_game ON gaming_tournaments(game);
CREATE INDEX IF NOT EXISTS idx_gaming_tournaments_status ON gaming_tournaments(status);
CREATE INDEX IF NOT EXISTS idx_gaming_tournaments_start_date ON gaming_tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament_id ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_team_members_team_id ON tournament_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_gaming_club_reviews_club_id ON gaming_club_reviews(club_id);
CREATE INDEX IF NOT EXISTS idx_gaming_achievements_user_id ON gaming_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gaming_stats_user_id ON user_gaming_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_gaming_friendships_user_id ON gaming_friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_gaming_friendships_friend_id ON gaming_friendships(friend_id);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE gaming_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_club_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gaming_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gaming_friendships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Gaming Clubs Policies
CREATE POLICY "Anyone can view gaming clubs" ON gaming_clubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clubs" ON gaming_clubs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Club owners can update their clubs" ON gaming_clubs FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Club owners can delete their clubs" ON gaming_clubs FOR DELETE USING (owner_id = auth.uid());

-- Gaming Sessions Policies
CREATE POLICY "Anyone can view public sessions" ON gaming_sessions FOR SELECT USING (visibility = 'public' OR host_id = auth.uid());
CREATE POLICY "Authenticated users can create sessions" ON gaming_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Host can update their sessions" ON gaming_sessions FOR UPDATE USING (host_id = auth.uid());
CREATE POLICY "Host can delete their sessions" ON gaming_sessions FOR DELETE USING (host_id = auth.uid());

-- Gaming Session Participants Policies
CREATE POLICY "Anyone can view session participants" ON gaming_session_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join sessions" ON gaming_session_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own participation" ON gaming_session_participants FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can leave sessions" ON gaming_session_participants FOR DELETE USING (user_id = auth.uid());

-- Gaming Tournaments Policies
CREATE POLICY "Anyone can view tournaments" ON gaming_tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments" ON gaming_tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Organizers can update their tournaments" ON gaming_tournaments FOR UPDATE USING (organizer_id = auth.uid());

-- Tournament Teams Policies
CREATE POLICY "Anyone can view tournament teams" ON tournament_teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON tournament_teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Captains can update their teams" ON tournament_teams FOR UPDATE USING (captain_id = auth.uid());

-- Tournament Team Members Policies
CREATE POLICY "Anyone can view team members" ON tournament_team_members FOR SELECT USING (true);
CREATE POLICY "Team captains can add members" ON tournament_team_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Gaming Club Reviews Policies
CREATE POLICY "Anyone can view reviews" ON gaming_club_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON gaming_club_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own reviews" ON gaming_club_reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own reviews" ON gaming_club_reviews FOR DELETE USING (user_id = auth.uid());

-- Gaming Achievements Policies
CREATE POLICY "Users can view their own achievements" ON gaming_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create achievements" ON gaming_achievements FOR INSERT WITH CHECK (true);

-- User Gaming Stats Policies
CREATE POLICY "Users can view their own stats" ON user_gaming_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view other users' stats" ON user_gaming_stats FOR SELECT USING (true);
CREATE POLICY "System can update stats" ON user_gaming_stats FOR UPDATE USING (true);

-- Gaming Friendships Policies
CREATE POLICY "Users can view their friendships" ON gaming_friendships FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());
CREATE POLICY "Users can create friendships" ON gaming_friendships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their friendships" ON gaming_friendships FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gaming_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_gaming_clubs_updated_at BEFORE UPDATE ON gaming_clubs
  FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

CREATE TRIGGER update_gaming_sessions_updated_at BEFORE UPDATE ON gaming_sessions
  FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

CREATE TRIGGER update_tournament_teams_updated_at BEFORE UPDATE ON tournament_teams
  FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

CREATE TRIGGER update_gaming_club_reviews_updated_at BEFORE UPDATE ON gaming_club_reviews
  FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

CREATE TRIGGER update_user_gaming_stats_updated_at BEFORE UPDATE ON user_gaming_stats
  FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

CREATE TRIGGER update_gaming_friendships_updated_at BEFORE UPDATE ON gaming_friendships
  FOR EACH ROW EXECUTE FUNCTION update_gaming_updated_at_column();

-- Function to update club rating when review is added
CREATE OR REPLACE FUNCTION update_club_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gaming_clubs
  SET 
    rating = (SELECT AVG(rating) FROM gaming_club_reviews WHERE club_id = NEW.club_id),
    total_reviews = (SELECT COUNT(*) FROM gaming_club_reviews WHERE club_id = NEW.club_id)
  WHERE id = NEW.club_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_club_rating_trigger AFTER INSERT OR UPDATE ON gaming_club_reviews
  FOR EACH ROW EXECUTE FUNCTION update_club_rating();

-- Function to update session current_players count
CREATE OR REPLACE FUNCTION update_session_player_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gaming_sessions
  SET current_players = (
    SELECT COUNT(*) 
    FROM gaming_session_participants 
    WHERE session_id = NEW.session_id AND is_active = true
  )
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_player_count_trigger 
  AFTER INSERT OR UPDATE OR DELETE ON gaming_session_participants
  FOR EACH ROW EXECUTE FUNCTION update_session_player_count();

-- Function to update tournament teams count
CREATE OR REPLACE FUNCTION update_tournament_teams_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gaming_tournaments
  SET current_teams = (
    SELECT COUNT(*) 
    FROM tournament_teams 
    WHERE tournament_id = NEW.tournament_id AND registration_status = 'confirmed'
  )
  WHERE id = NEW.tournament_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournament_teams_count_trigger 
  AFTER INSERT OR UPDATE ON tournament_teams
  FOR EACH ROW EXECUTE FUNCTION update_tournament_teams_count();
