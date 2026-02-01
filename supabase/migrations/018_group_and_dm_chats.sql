-- Group Chat Backend Tables
-- Supports automatic match group chats with expense tracking

-- Group Chats Table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  chat_type VARCHAR(50) NOT NULL CHECK (chat_type IN ('match', 'event', 'custom')),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'INR',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Chat Members Table
CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  share_amount DECIMAL(10, 2) NOT NULL, -- Their share of total cost
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'settled')),
  time_joined_minutes INTEGER DEFAULT 0, -- Minutes since match/event start
  UNIQUE(group_chat_id, user_id)
);

-- Group Messages Table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'expense', 'payment', 'system')),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);

-- Ensure legacy tables get missing columns (if created in earlier migrations)
ALTER TABLE IF EXISTS group_messages
  ADD COLUMN IF NOT EXISTS group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS group_messages
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS group_messages
  ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE IF EXISTS group_messages
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';

ALTER TABLE IF EXISTS group_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE IF EXISTS group_messages
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS group_messages
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Expense Items Table
CREATE TABLE IF NOT EXISTS expense_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  split_between UUID[] NOT NULL, -- Array of user IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expense_items
  ADD COLUMN IF NOT EXISTS group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE;

-- Direct Messages / Conversations Tables
-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- Direct Messages Table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  media_url TEXT,
  media_thumbnail TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_group_chats_match_id ON group_chats(match_id);
CREATE INDEX idx_group_chats_event_id ON group_chats(event_id);
CREATE INDEX idx_group_chat_members_group ON group_chat_members(group_chat_id);
CREATE INDEX idx_group_chat_members_user ON group_chat_members(user_id);
CREATE INDEX idx_group_messages_group ON group_messages(group_chat_id);
CREATE INDEX idx_group_messages_sender ON group_messages(sender_id);
CREATE INDEX idx_group_messages_created ON group_messages(created_at);
CREATE INDEX idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX idx_direct_messages_conv ON direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_direct_messages_read ON direct_messages(conversation_id, is_read);

-- RLS Policies for Group Chats
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group chats they're members of"
  ON group_chats FOR SELECT
  USING (
    id IN (
      SELECT group_chat_id FROM group_chat_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create group chats"
  ON group_chats FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for Group Chat Members
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members in their group chats"
  ON group_chat_members FOR SELECT
  USING (
    group_chat_id IN (
      SELECT id FROM group_chats 
      WHERE id IN (
        SELECT group_chat_id FROM group_chat_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for Group Messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their group chats"
  ON group_messages FOR SELECT
  USING (
    group_chat_id IN (
      SELECT group_chat_id FROM group_chat_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their group chats"
  ON group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    group_chat_id IN (
      SELECT group_chat_id FROM group_chat_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- RLS Policies for Direct Messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON direct_messages FOR SELECT
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Function to auto-update group chat timestamp
CREATE OR REPLACE FUNCTION update_group_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_chats SET updated_at = NOW() WHERE id = NEW.group_chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_message_timestamp
AFTER INSERT ON group_messages
FOR EACH ROW
EXECUTE FUNCTION update_group_chat_timestamp();

-- Function to auto-update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dm_conversation_timestamp
AFTER INSERT ON direct_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
