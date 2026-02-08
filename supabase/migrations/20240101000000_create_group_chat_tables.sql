-- Create group_chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  event_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on match_id
CREATE INDEX idx_group_chats_match_id ON group_chats(match_id);
CREATE INDEX idx_group_chats_created_by ON group_chats(created_by);
CREATE INDEX idx_group_chats_updated_at ON group_chats(updated_at);

-- Create chat_members table
CREATE TABLE IF NOT EXISTS chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_avatar TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(group_chat_id, user_id)
);

-- Create indexes for chat_members
CREATE INDEX idx_chat_members_group_chat_id ON chat_members(group_chat_id);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_members_is_active ON chat_members(is_active);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'invite', 'payment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for chat_messages
CREATE INDEX idx_chat_messages_group_chat_id ON chat_messages(group_chat_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Create chat_invites table
CREATE TABLE IF NOT EXISTS chat_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for chat_invites
CREATE INDEX idx_chat_invites_group_chat_id ON chat_invites(group_chat_id);
CREATE INDEX idx_chat_invites_token ON chat_invites(token);
CREATE INDEX idx_chat_invites_status ON chat_invites(status);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE group_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_members;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_invites;

-- Create RLS policies
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_invites ENABLE ROW LEVEL SECURITY;

-- Policies for group_chats
CREATE POLICY "Users can view chats they're members of"
  ON group_chats FOR SELECT
  USING (
    id IN (
      SELECT group_chat_id FROM chat_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can create chats"
  ON group_chats FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies for chat_members
CREATE POLICY "Users can view members of their chats"
  ON chat_members FOR SELECT
  USING (
    group_chat_id IN (
      SELECT id FROM group_chats WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Chat admins can manage members"
  ON chat_members FOR INSERT
  WITH CHECK (
    group_chat_id IN (
      SELECT id FROM group_chats WHERE created_by = auth.uid()
    )
  );

-- Policies for chat_messages
CREATE POLICY "Users can view messages in their chats"
  ON chat_messages FOR SELECT
  USING (
    group_chat_id IN (
      SELECT group_chat_id FROM chat_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can send messages to their chats"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    group_chat_id IN (
      SELECT group_chat_id FROM chat_members WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Policies for chat_invites
CREATE POLICY "Users can view invites for their chats"
  ON chat_invites FOR SELECT
  USING (
    group_chat_id IN (
      SELECT id FROM group_chats WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create invites for their chats"
  ON chat_invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    group_chat_id IN (
      SELECT id FROM group_chats WHERE created_by = auth.uid()
    )
  );
