# Chat Service Deployment Guide

**Scope**: Deploy group chat + direct message backend with Supabase and enable the new chat UI.

## 1) Prerequisites
- Supabase project access (URL + service role key or CLI access)
- Local repo with the new chat services and migration
- Node.js + npm installed

## 2) Verify Required Files
- Migration: [supabase/migrations/018_group_and_dm_chats.sql](supabase/migrations/018_group_and_dm_chats.sql)
- Services:
  - [src/services/groupChatService.ts](src/services/groupChatService.ts)
  - [src/services/directMessageService.ts](src/services/directMessageService.ts)
- Components:
  - [src/components/chat/GroupChatRoom.tsx](src/components/chat/GroupChatRoom.tsx)
  - [src/components/chat/DirectMessageThread.tsx](src/components/chat/DirectMessageThread.tsx)

## 3) Deploy Database Migration
### Option A — Supabase CLI
```bash
supabase db push
```

### Option B — Supabase SQL Editor
Paste the contents of:
- [supabase/migrations/018_group_and_dm_chats.sql](supabase/migrations/018_group_and_dm_chats.sql)

Then run it in the SQL editor.

## 4) Validate Database Objects
Run these queries in Supabase SQL editor:
```sql
-- Confirm tables
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'group_chats','group_chat_members','group_messages',
    'expense_items','conversations','direct_messages'
  );

-- Basic RLS check
select relname, relrowsecurity
from pg_class
where relname in ('group_chats','group_chat_members','group_messages','conversations','direct_messages');
```

Expected:
- All tables listed
- `relrowsecurity` = true for chat tables

## 5) Configure Environment Variables
Ensure Vite has Supabase env values:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 6) Update Routes (if not already)
Add routes in your router:
```tsx
<Route path="/chat/group/:groupChatId" element={<GroupChatRoom />} />
<Route path="/chat/dm/:conversationId" element={<DirectMessageThread />} />
```

## 7) Enable Real-time
Supabase realtime is already used in components. Confirm:
- Realtime enabled for your project
- Tables are in the replication publication

SQL check:
```sql
select * from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename in ('group_messages','direct_messages');
```
If missing, enable realtime for those tables in Supabase UI.

## 8) Build & Deploy Frontend
### Local build
```bash
npm install
npm run build
```

### Deploy (Vercel)
- Connect repo to Vercel
- Set env vars in Vercel dashboard
- Deploy

## 9) Post-Deploy Smoke Tests
### Group Chat
1. Create match
2. Check DB: `group_chats` row created
3. Join match with another user
4. Check `group_chat_members` rows updated
5. Send message → see realtime update

### Direct Messages
1. Click profile “Chat”
2. Confirm conversation row in `conversations`
3. Send DM → see row in `direct_messages`
4. Confirm read receipts update

## 10) Troubleshooting
**Messages not appearing real-time**
- Check realtime publication and RLS policies
- Verify the channel subscription is active

**Group chat not created**
- Confirm [src/services/matchService.ts](src/services/matchService.ts) calls `groupChatService.createMatchGroupChat()`

**Permission errors**
- Check RLS policies in [supabase/migrations/018_group_and_dm_chats.sql](supabase/migrations/018_group_and_dm_chats.sql)
- Ensure authenticated user is member of the chat

---

## Deployment Checklist
- [ ] Migration applied successfully
- [ ] Realtime publication includes `group_messages`, `direct_messages`
- [ ] Env vars set for Supabase
- [ ] Routes added
- [ ] Build succeeds
- [ ] Group chat auto-creation verified
- [ ] DM flow verified
