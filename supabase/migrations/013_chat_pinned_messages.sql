CREATE TABLE IF NOT EXISTS chat_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pinned messages in their rooms"
  ON chat_pinned_messages FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Moderators can pin messages"
  ON chat_pinned_messages FOR INSERT
  WITH CHECK (
    pinned_by = auth.uid()
    AND room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can unpin messages"
  ON chat_pinned_messages FOR DELETE
  USING (
    room_id IN (
      SELECT room_id FROM chat_room_members WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_pinned_messages;


