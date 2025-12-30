-- ============================================
-- Memory Backend Migration
-- Tables for likes, comments, shares on memories
-- ============================================

-- Memory Likes Table
CREATE TABLE IF NOT EXISTS memory_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(memory_id, user_id)
);

CREATE INDEX idx_memory_likes_memory_id ON memory_likes(memory_id);
CREATE INDEX idx_memory_likes_user_id ON memory_likes(user_id);
CREATE INDEX idx_memory_likes_created_at ON memory_likes(created_at DESC);

-- Memory Comments Table
CREATE TABLE IF NOT EXISTS memory_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_comments_memory_id ON memory_comments(memory_id);
CREATE INDEX idx_memory_comments_user_id ON memory_comments(user_id);
CREATE INDEX idx_memory_comments_created_at ON memory_comments(created_at DESC);

-- Memory Shares Table
CREATE TABLE IF NOT EXISTS memory_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_to TEXT, -- platform or destination
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_shares_memory_id ON memory_shares(memory_id);
CREATE INDEX idx_memory_shares_user_id ON memory_shares(user_id);
CREATE INDEX idx_memory_shares_created_at ON memory_shares(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE memory_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_shares ENABLE ROW LEVEL SECURITY;

-- Memory Likes Policies
CREATE POLICY "Anyone can view memory likes"
  ON memory_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like memories"
  ON memory_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON memory_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Memory Comments Policies
CREATE POLICY "Anyone can view memory comments"
  ON memory_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment on memories"
  ON memory_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON memory_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON memory_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Memory Shares Policies
CREATE POLICY "Anyone can view memory shares"
  ON memory_shares FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can share memories"
  ON memory_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS FOR STATS
-- ============================================

-- Function to get memory stats
CREATE OR REPLACE FUNCTION get_memory_stats(p_memory_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_like_count INT;
  v_comment_count INT;
  v_share_count INT;
BEGIN
  SELECT COUNT(*) INTO v_like_count FROM memory_likes WHERE memory_id = p_memory_id;
  SELECT COUNT(*) INTO v_comment_count FROM memory_comments WHERE memory_id = p_memory_id;
  SELECT COUNT(*) INTO v_share_count FROM memory_shares WHERE memory_id = p_memory_id;
  
  RETURN json_build_object(
    'memory_id', p_memory_id,
    'like_count', v_like_count,
    'comment_count', v_comment_count,
    'share_count', v_share_count
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at on comment edits
CREATE OR REPLACE FUNCTION update_memory_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memory_comments_updated_at
  BEFORE UPDATE ON memory_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_comment_timestamp();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE memory_likes IS 'Stores likes on memory entries';
COMMENT ON TABLE memory_comments IS 'Stores comments on memory entries';
COMMENT ON TABLE memory_shares IS 'Tracks when memories are shared';
COMMENT ON FUNCTION get_memory_stats IS 'Returns aggregated stats for a memory (likes, comments, shares)';
