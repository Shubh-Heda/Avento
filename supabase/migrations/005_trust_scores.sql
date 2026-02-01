
ALTER TABLE IF EXISTS user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements ENABLE ROW LEVEL SECURITY;

-- Trust scores: Public read, owner write
CREATE POLICY IF NOT EXISTS "Trust scores are publicly visible"
  ON user_trust_scores FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update own trust score"
  ON user_trust_scores FOR UPDATE
  USING (user_id = auth.uid());

-- History: Users can view their own history
CREATE POLICY IF NOT EXISTS "Users can view their score history"
  ON trust_score_history FOR SELECT
  USING (user_id = auth.uid());

-- Feedback: Users can give and view feedback
CREATE POLICY IF NOT EXISTS "Users can view feedback about them"
  ON user_feedback FOR SELECT
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can give feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Reports: Users can report others
CREATE POLICY IF NOT EXISTS "Users can view their reports"
  ON user_reports FOR SELECT
  USING (reporter_id = auth.uid() OR reported_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can create reports"
  ON user_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Achievements: Public read
CREATE POLICY IF NOT EXISTS "Achievements are publicly visible"
  ON achievements FOR SELECT
  TO public
  USING (true);

CREATE POLICY IF NOT EXISTS "User achievements are publicly visible"
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


