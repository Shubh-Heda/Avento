-- ============================================
-- Trust & Reliability Score System Migration
-- ============================================

-- User Trust Scores table
CREATE TABLE IF NOT EXISTS user_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Overall scores (0-100)
  overall_score INTEGER DEFAULT 50 CHECK (overall_score >= 0 AND overall_score <= 100),
  reliability_score INTEGER DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  behavior_score INTEGER DEFAULT 50 CHECK (behavior_score >= 0 AND behavior_score <= 100),
  community_score INTEGER DEFAULT 50 CHECK (community_score >= 0 AND community_score <= 100),
  
  -- Score components
  attendance_rate DECIMAL(5,2) DEFAULT 0, -- % of matches attended
  on_time_rate DECIMAL(5,2) DEFAULT 0, -- % arrived on time
  payment_reliability DECIMAL(5,2) DEFAULT 0, -- % paid on time
  cancellation_rate DECIMAL(5,2) DEFAULT 0, -- % of cancellations
  
  -- Behavior metrics
  positive_feedback_count INTEGER DEFAULT 0,
  negative_feedback_count INTEGER DEFAULT 0,
  reports_received INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  
  -- Community engagement
  posts_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0, -- Marked as helpful by others
  matches_organized INTEGER DEFAULT 0,
  matches_attended INTEGER DEFAULT 0,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  
  -- Badges earned
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Level and experience
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trust Score History (for tracking changes over time)
CREATE TABLE IF NOT EXISTS trust_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score_type TEXT NOT NULL CHECK (score_type IN ('overall', 'reliability', 'behavior', 'community')),
  old_score INTEGER,
  new_score INTEGER,
  change_amount INTEGER,
  reason TEXT NOT NULL,
  related_id TEXT, -- Match/event/post ID that caused the change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Feedback/Reviews
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id TEXT, -- Related match/event
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('positive', 'neutral', 'negative')),
  categories TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['punctual', 'friendly', 'skilled', 'team_player']
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id, match_id)
);

-- User Reports
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  match_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievement/Badges system
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT, -- 'reliability', 'community', 'skill', 'social'
  points INTEGER DEFAULT 0,
  requirements JSONB, -- Criteria to earn the badge
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON user_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_scores_overall ON user_trust_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_trust_history_user ON trust_score_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_to_user ON user_feedback(to_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_from_user ON user_feedback(from_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Function to calculate overall trust score
CREATE OR REPLACE FUNCTION calculate_overall_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_reliability INTEGER;
  v_behavior INTEGER;
  v_community INTEGER;
  v_overall INTEGER;
BEGIN
  SELECT 
    reliability_score,
    behavior_score,
    community_score
  INTO v_reliability, v_behavior, v_community
  FROM user_trust_scores
  WHERE user_id = p_user_id;
  
  -- Weighted average: 40% reliability, 35% behavior, 25% community
  v_overall := ROUND(
    (v_reliability * 0.40) + 
    (v_behavior * 0.35) + 
    (v_community * 0.25)
  );
  
  RETURN v_overall;
END;
$$ LANGUAGE plpgsql;

-- Function to update trust score
CREATE OR REPLACE FUNCTION update_trust_score(
  p_user_id UUID,
  p_score_type TEXT,
  p_change INTEGER,
  p_reason TEXT,
  p_related_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old_score INTEGER;
  v_new_score INTEGER;
BEGIN
  -- Get current score
  EXECUTE format('SELECT %I FROM user_trust_scores WHERE user_id = $1', p_score_type)
  INTO v_old_score
  USING p_user_id;
  
  -- Calculate new score (clamp between 0 and 100)
  v_new_score := GREATEST(0, LEAST(100, v_old_score + p_change));
  
  -- Update score
  EXECUTE format('UPDATE user_trust_scores SET %I = $1, updated_at = NOW() WHERE user_id = $2', p_score_type)
  USING v_new_score, p_user_id;
  
  -- Record history
  INSERT INTO trust_score_history (user_id, score_type, old_score, new_score, change_amount, reason, related_id)
  VALUES (p_user_id, p_score_type, v_old_score, v_new_score, p_change, p_reason, p_related_id);
  
  -- Update overall score if component score changed
  IF p_score_type != 'overall' THEN
    UPDATE user_trust_scores
    SET overall_score = calculate_overall_trust_score(p_user_id),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to record attendance (called when user attends match)
CREATE OR REPLACE FUNCTION record_attendance(
  p_user_id UUID,
  p_match_id TEXT,
  p_was_on_time BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Update attendance metrics
  UPDATE user_trust_scores
  SET 
    matches_attended = matches_attended + 1,
    on_time_rate = CASE 
      WHEN matches_attended = 0 THEN (CASE WHEN p_was_on_time THEN 100 ELSE 0 END)
      ELSE ((on_time_rate * matches_attended + (CASE WHEN p_was_on_time THEN 100 ELSE 0 END)) / (matches_attended + 1))
    END,
    attendance_rate = ((matches_attended + 1.0) / NULLIF(matches_attended + 1, 0)) * 100,
    current_streak = CASE 
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_activity_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, current_streak + 1),
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update reliability score
  PERFORM update_trust_score(p_user_id, 'reliability_score', 
    CASE WHEN p_was_on_time THEN 2 ELSE 1 END, 
    'Attended match',
    p_match_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to record cancellation
CREATE OR REPLACE FUNCTION record_cancellation(
  p_user_id UUID,
  p_match_id TEXT,
  p_hours_before INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_penalty INTEGER;
BEGIN
  -- Calculate penalty based on notice given
  v_penalty := CASE
    WHEN p_hours_before >= 24 THEN -1
    WHEN p_hours_before >= 12 THEN -3
    WHEN p_hours_before >= 6 THEN -5
    WHEN p_hours_before >= 2 THEN -8
    ELSE -10
  END;
  
  -- Update cancellation rate
  UPDATE user_trust_scores
  SET 
    cancellation_rate = ((cancellation_rate * matches_attended + 100) / NULLIF(matches_attended + 1, 0)),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Apply penalty
  PERFORM update_trust_score(p_user_id, 'reliability_score', v_penalty, 
    format('Cancelled with %s hours notice', p_hours_before),
    p_match_id
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Trust scores: Public read, owner write
CREATE POLICY "Trust scores are publicly visible"
  ON user_trust_scores FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own trust score"
  ON user_trust_scores FOR UPDATE
  USING (user_id = auth.uid());

-- History: Users can view their own history
CREATE POLICY "Users can view their score history"
  ON trust_score_history FOR SELECT
  USING (user_id = auth.uid());

-- Feedback: Users can give and view feedback
CREATE POLICY "Users can view feedback about them"
  ON user_feedback FOR SELECT
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "Users can give feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Reports: Users can report others
CREATE POLICY "Users can view their reports"
  ON user_reports FOR SELECT
  USING (reporter_id = auth.uid() OR reported_user_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON user_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Achievements: Public read
CREATE POLICY "Achievements are publicly visible"
  ON achievements FOR SELECT
  TO public
  USING (true);

CREATE POLICY "User achievements are publicly visible"
  ON user_achievements FOR SELECT
  TO public
  USING (true);

-- Insert default achievements
INSERT INTO achievements (code, name, description, icon, category, points) VALUES
('first_match', 'First Match', 'Attended your first match', '🎯', 'reliability', 10),
('on_time_10', 'Punctual Pro', 'Arrived on time for 10 matches', '⏰', 'reliability', 25),
('streak_7', 'Weekly Warrior', '7-day activity streak', '🔥', 'reliability', 20),
('streak_30', 'Monthly Champion', '30-day activity streak', '🏆', 'reliability', 100),
('helpful_10', 'Community Helper', 'Received 10 helpful votes', '🤝', 'community', 30),
('organizer_5', 'Match Maker', 'Organized 5 matches', '📋', 'community', 40),
('perfect_score', 'Perfect Score', 'Maintained 95+ trust score for 30 days', '⭐', 'reliability', 200),
('social_butterfly', 'Social Butterfly', 'Made 20 friends', '🦋', 'social', 50),
('verified_player', 'Verified Player', 'Completed verification', '✅', 'reliability', 15)
ON CONFLICT (code) DO NOTHING;

-- Trigger to initialize trust score for new users
CREATE OR REPLACE FUNCTION initialize_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_trust_scores (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_trust_score
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_trust_score();
