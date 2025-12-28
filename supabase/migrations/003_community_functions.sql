-- ============================================
-- Additional SQL Functions for Community Backend
-- ============================================

-- Function to increment hashtag usage
CREATE OR REPLACE FUNCTION increment_hashtag_usage(tag_name TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO hashtags (tag, usage_count, last_used_at)
  VALUES (tag_name, 1, NOW())
  ON CONFLICT (tag) DO UPDATE
  SET 
    usage_count = hashtags.usage_count + 1,
    last_used_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(days_back INT DEFAULT 7, limit_count INT DEFAULT 10)
RETURNS TABLE (
  tag TEXT,
  usage_count INT,
  last_used_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT h.tag, h.usage_count, h.last_used_at
  FROM hashtags h
  WHERE h.last_used_at >= NOW() - (days_back || ' days')::INTERVAL
  ORDER BY h.usage_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user feed (following + own posts)
CREATE OR REPLACE FUNCTION get_user_feed(
  user_profile_id UUID,
  category_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  content TEXT,
  category TEXT,
  like_count INT,
  comment_count INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    p.content,
    p.category,
    p.like_count,
    p.comment_count,
    p.created_at
  FROM community_posts p
  WHERE 
    p.deleted_at IS NULL
    AND (
      p.author_id = user_profile_id
      OR p.author_id IN (
        SELECT following_id FROM user_follows WHERE follower_id = user_profile_id
      )
    )
    AND (category_filter IS NULL OR p.category = category_filter)
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get post engagement stats
CREATE OR REPLACE FUNCTION get_post_engagement(post_id_input UUID)
RETURNS TABLE (
  likes INT,
  comments INT,
  shares INT,
  views INT,
  bookmarks INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.like_count,
    p.comment_count,
    p.share_count,
    p.view_count,
    (SELECT COUNT(*) FROM post_bookmarks WHERE post_id = post_id_input)::INT
  FROM community_posts p
  WHERE p.id = post_id_input;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can post (rate limiting)
CREATE OR REPLACE FUNCTION can_user_post(user_profile_id UUID, max_posts_per_hour INT DEFAULT 10)
RETURNS BOOLEAN AS $$
DECLARE
  post_count INT;
BEGIN
  SELECT COUNT(*) INTO post_count
  FROM community_posts
  WHERE 
    author_id = user_profile_id
    AND created_at >= NOW() - INTERVAL '1 hour';
  
  RETURN post_count < max_posts_per_hour;
END;
$$ LANGUAGE plpgsql;

-- Function to get recommended users to follow
CREATE OR REPLACE FUNCTION get_recommended_follows(
  user_profile_id UUID,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  profile_id UUID,
  username TEXT,
  display_name TEXT,
  bio TEXT,
  follower_count INT,
  mutual_friends INT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_following AS (
    SELECT following_id FROM user_follows WHERE follower_id = user_profile_id
  ),
  friends_of_friends AS (
    SELECT 
      uf.following_id,
      COUNT(*) as mutual_count
    FROM user_follows uf
    WHERE 
      uf.follower_id IN (SELECT following_id FROM user_following)
      AND uf.following_id != user_profile_id
      AND uf.following_id NOT IN (SELECT following_id FROM user_following)
    GROUP BY uf.following_id
  )
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.bio,
    p.follower_count,
    COALESCE(fof.mutual_count, 0)::INT
  FROM profiles p
  LEFT JOIN friends_of_friends fof ON p.id = fof.following_id
  WHERE 
    p.id != user_profile_id
    AND p.id NOT IN (SELECT following_id FROM user_following)
  ORDER BY fof.mutual_count DESC NULLS LAST, p.follower_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_profile_id UUID)
RETURNS TABLE (
  total_posts INT,
  total_likes_received INT,
  total_comments_received INT,
  total_followers INT,
  total_following INT,
  posts_this_week INT,
  engagement_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(*)::INT as posts,
      SUM(like_count)::INT as likes,
      SUM(comment_count)::INT as comments,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::INT as recent_posts
    FROM community_posts
    WHERE author_id = user_profile_id AND deleted_at IS NULL
  ),
  follow_stats AS (
    SELECT
      (SELECT COUNT(*)::INT FROM user_follows WHERE following_id = user_profile_id) as followers,
      (SELECT COUNT(*)::INT FROM user_follows WHERE follower_id = user_profile_id) as following
  )
  SELECT 
    us.posts,
    us.likes,
    us.comments,
    fs.followers,
    fs.following,
    us.recent_posts,
    CASE 
      WHEN us.posts > 0 THEN ROUND((us.likes + us.comments)::DECIMAL / us.posts, 2)
      ELSE 0
    END
  FROM user_stats us, follow_stats fs;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old deleted posts (maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_posts(days_old INT DEFAULT 30)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH deleted_posts AS (
    DELETE FROM community_posts
    WHERE 
      deleted_at IS NOT NULL
      AND deleted_at < NOW() - (days_old || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*)::INT INTO deleted_count FROM deleted_posts;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_hashtag_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_hashtags TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_engagement TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_post TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_follows TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_summary TO authenticated;

-- Example usage:
-- SELECT * FROM get_trending_hashtags(7, 10);
-- SELECT * FROM get_user_feed('user-uuid', 'sports', 20, 0);
-- SELECT * FROM get_post_engagement('post-uuid');
-- SELECT can_user_post('user-uuid', 10);
-- SELECT * FROM get_recommended_follows('user-uuid', 10);
-- SELECT * FROM get_user_activity_summary('user-uuid');
