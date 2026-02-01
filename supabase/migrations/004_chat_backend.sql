CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  room_type TEXT DEFAULT 'group',
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view read receipts in their rooms"
  ON message_read_receipts FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM chat_messages
      WHERE room_id IN (
        SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID, p_room_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_read_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  SELECT last_read_at INTO v_last_read_at
  FROM chat_room_members
  WHERE user_id = p_user_id AND room_id = p_room_id;
  
  SELECT COUNT(*) INTO v_count
  FROM chat_messages
  WHERE room_id = p_room_id 
    AND created_at > COALESCE(v_last_read_at, '1970-01-01'::TIMESTAMPTZ)
    AND sender_id != p_user_id;
    
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's chat rooms with unread counts
CREATE OR REPLACE FUNCTION get_user_chat_rooms(p_user_id UUID)
RETURNS TABLE (
  room_id UUID,
  room_name TEXT,
  room_type TEXT,
  room_avatar TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER,
  member_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.name,
    cr.room_type,
    cr.avatar_url,
    cr.last_message_at,
    get_unread_message_count(p_user_id, cr.id),
    (SELECT COUNT(*)::INTEGER FROM chat_room_members WHERE room_id = cr.id)
  FROM chat_rooms cr
  INNER JOIN chat_room_members crm ON cr.id = crm.room_id
  WHERE crm.user_id = p_user_id
  ORDER BY cr.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;


