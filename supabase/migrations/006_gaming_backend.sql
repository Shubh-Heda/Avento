
-- ============================================

-- Gaming Clubs Policies





-- Gaming Sessions Policies





-- Gaming Session Participants Policies





-- Gaming Tournaments Policies




-- Tournament Teams Policies 




-- Tournament Team Members Policies



-- Gaming Club Reviews Policies





-- Gaming Achievements Policies



-- User Gaming Stats Policies




-- Gaming Friendships Policies




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


