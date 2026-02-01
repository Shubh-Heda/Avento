-- ============================================
-- Chat Moderation & Reporting
-- ============================================

-- Reports filed by members against chat messages
CREATE TABLE IF NOT EXISTS chat_message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL ,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'actioned', 'dismissed')),
  actioned_by UUID ,
  actioned_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderator/admin actions taken in rooms
CREATE TABLE IF NOT EXISTS chat_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL ,
  action_type TEXT NOT NULL CHECK (action_type IN ('delete_message', 'pin_message', 'kick_user', 'ban_user', 'mute_user')),
  target_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  target_user_id UUID ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_message_reports_room ON chat_message_reports(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reports_status ON chat_message_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_message_reports_message ON chat_message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_actions_room ON chat_moderation_actions(room_id, created_at DESC);

-- Row Level Security
ALTER TABLE chat_message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_moderation_actions ENABLE ROW LEVEL SECURITY;

-- Helper predicate: member of room
-- (Uses existing chat_room_members table)

-- Policies: chat_message_reports
CREATE POLICY "Members can view reports for their rooms"
  ON chat_message_reports FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can file reports on messages in their rooms"
  ON chat_message_reports FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid()
    AND room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Moderators can update report status"
  ON chat_message_reports FOR UPDATE
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Policies: chat_moderation_actions
CREATE POLICY "Members can view moderation actions in their rooms"
  ON chat_moderation_actions FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Moderators can log moderation actions"
  ON chat_moderation_actions FOR INSERT
  WITH CHECK (
    actor_id = auth.uid()
    AND room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Realtime publication (optional, for dashboards)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_message_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_moderation_actions;


