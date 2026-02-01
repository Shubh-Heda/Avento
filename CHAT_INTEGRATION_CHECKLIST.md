# Backend Chat Integration - Component Checklist

## ✅ Backend Status
- [x] Database schema created (migration 018)
- [x] groupChatService.ts implemented
- [x] directMessageService.ts implemented
- [x] matchService.ts updated for auto-chat creation
- [x] All RLS policies configured
- [x] All triggers set up

## Frontend Components Needed

### 1. Group Chat View
**File**: `src/components/chat/GroupChatRoom.tsx`
**Purpose**: Display messages in a group chat

```typescript
// Component structure needed:
- Header: Group name, member count
- Member List: Show all members + their shares
- Message Thread: Display all messages
- Input: Send message form
- System Messages: Show join notifications

// Data to display:
- groupChatMembers[] with:
  - user.name
  - user.photo
  - shareAmount (₹XXX)
  - paymentStatus ('paid' | 'pending')

// Actions:
- Send message: groupChatService.sendGroupMessage()
- Mark paid: groupChatService.markPaymentDone()
- Add expense: groupChatService.addExpense()
```

### 2. Group Chat List
**File**: `src/components/chat/GroupChatList.tsx`
**Purpose**: Show all group chats user is part of

```typescript
// List all chats where user is member:
const chats = await groupChatService.getGroupChatDetails(groupChatId);

// Display:
- Chat name
- Last message preview
- Member count
- Click to open GroupChatRoom
```

### 3. Direct Message Thread
**File**: `src/components/chat/DirectMessageThread.tsx`
**Purpose**: 1-on-1 messaging like WhatsApp

```typescript
// Features:
- Get conversation: directMessageService.getOrCreateConversation()
- Load messages: directMessageService.getMessages()
- Send message: directMessageService.sendMessage()
- Mark as read: directMessageService.markAsRead()
- Show typing indicator (optional)
```

### 4. Conversations List
**File**: `src/components/chat/ConversationsList.tsx`
**Purpose**: Show all DM conversations

```typescript
// Features:
- Get all conversations: directMessageService.getUserConversations()
- Show unread count: directMessageService.getUnreadCount()
- Last message preview
- Click to open DirectMessageThread
```

### 5. Chat Button in Profile Card
**File**: `src/components/profile/PlayerCard.tsx` (or equivalent)
**Location**: Where player profile is shown

```typescript
<button onClick={async () => {
  const conv = await directMessageService.getOrCreateConversation(
    currentUserId,
    profileUserId
  );
  navigate(`/chat/dm/${conv.id}`);
}}>
  💬 Chat
</button>
```

### 6. Real-time Message Listener Hook
**File**: `src/hooks/useGroupChatMessages.ts`
**Purpose**: Subscribe to new messages in real-time

```typescript
// Hook pattern:
useEffect(() => {
  const subscription = supabase
    .channel(`group_${groupChatId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'group_messages',
      filter: `group_chat_id=eq.${groupChatId}`
    }, (payload) => {
      setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [groupChatId]);
```

### 7. Real-time DM Listener Hook
**File**: `src/hooks/useDirectMessages.ts`
**Purpose**: Subscribe to new DMs in real-time

```typescript
// Same pattern as group chat but for:
// table: 'direct_messages'
// filter: `conversation_id=eq.${conversationId}`
```

## Integration Points in Existing Files

### CreateMatchPlan.tsx (or match creation flow)
```typescript
// After match creation:
const match = await matchService.createMatch(data, userId);
// ✓ Group chat is AUTOMATICALLY created
// ✓ User is AUTOMATICALLY added as first member
// ✓ Navigate to GroupChatRoom:
navigate(`/chat/group/${match.groupChatId}`);
```

### MatchFinder.tsx (or match joining flow)
```typescript
// After user joins match:
await matchService.joinMatch(matchId, userId, userName);
// ✓ User AUTOMATICALLY added to group chat
// ✓ Shares AUTOMATICALLY recalculated
// ✓ Navigate to GroupChatRoom:
navigate(`/chat/group/${match.groupChatId}`);
```

### PlayerProfile.tsx (or player detail view)
```typescript
// Add chat button:
<Button 
  onClick={async () => {
    const conv = await directMessageService.getOrCreateConversation(
      currentUserId,
      targetUserId
    );
    navigate(`/chat/dm/${conv.id}`);
  }}
>
  💬 Send Message
</Button>
```

### Navigation/Router Setup
```typescript
// Add new routes:
<Route path="/chat/group/:groupChatId" element={<GroupChatRoom />} />
<Route path="/chat/dm/:conversationId" element={<DirectMessageThread />} />
<Route path="/chat/conversations" element={<ConversationsList />} />
```

## Data Flow Diagram

```
CREATE MATCH PLAN
    ↓
matchService.createMatch()
    ↓
groupChatService.createMatchGroupChat() ← AUTO TRIGGERED
    ↓
group_chats table + group_chat_members (organizer added)
    ↓
GroupChatRoom component displays with:
- Messages from group_messages table
- Members from group_chat_members table
- Real-time updates via Supabase.channel()

---

USER JOINS MATCH
    ↓
matchService.joinMatch()
    ↓
groupChatService.addGroupChatMember() ← AUTO TRIGGERED
    ↓
group_chat_members table updated + shares recalculated
    ↓
System message posted: "User joined. Share now ₹XXX"
    ↓
GroupChatRoom reflects changes in real-time

---

CLICK CHAT BUTTON ON PROFILE
    ↓
directMessageService.getOrCreateConversation()
    ↓
conversations table updated
    ↓
DirectMessageThread component loads with:
- Messages from direct_messages table
- Real-time updates via Supabase.channel()
```

## Testing Checklist

- [ ] Create match → Group chat appears in database
- [ ] View group chat → See organizer as member with correct share
- [ ] Join match → New member appears in group chat with recalculated share
- [ ] Send message → Message appears for all members in real-time
- [ ] Add expense → Message and calculation updated correctly
- [ ] Mark payment done → Status changes to 'paid'
- [ ] Click "Chat" on profile → Direct message conversation created
- [ ] Send DM → Message appears in real-time
- [ ] Search messages → Full-text search works
- [ ] Unread count → Tracking works correctly

## Performance Considerations

1. **Message Pagination**: Load 50 at a time with offset
   ```typescript
   await directMessageService.getMessages(convId, 50, page * 50);
   ```

2. **Member Count Limit**: Groups with 100+ members may need optimization
   ```typescript
   // Consider pagination for member list in very large groups
   ```

3. **Real-time Subscriptions**: Unsubscribe when component unmounts
   ```typescript
   useEffect(() => {
     const sub = supabase.channel(...).subscribe();
     return () => sub.unsubscribe();
   }, []);
   ```

## Priority Order for Implementation

### Phase 1 (Critical - Day 1)
1. GroupChatRoom.tsx - Show existing matches with chat
2. Update MatchDetail to show group members + shares
3. Real-time listeners for group messages

### Phase 2 (Important - Day 2)
1. DirectMessageThread.tsx - 1-on-1 chat
2. ConversationsList.tsx - All DM conversations
3. Chat button in profile cards

### Phase 3 (Nice to have)
1. Search messages
2. Media uploads
3. Message reactions
4. Typing indicators
5. Read receipts UI

## Database Verification Commands

```sql
-- Verify tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%chat%' OR table_name LIKE '%message%' OR table_name = 'conversations';

-- Check group chats for a match:
SELECT * FROM group_chats WHERE match_id = 'YOUR_MATCH_ID';

-- Check members in a group:
SELECT u.name, gcm.share_amount, gcm.payment_status 
FROM group_chat_members gcm
JOIN users u ON gcm.user_id = u.id
WHERE gcm.group_chat_id = 'YOUR_GROUP_CHAT_ID';

-- Check messages:
SELECT sender_id, content, created_at FROM group_messages 
WHERE group_chat_id = 'YOUR_GROUP_CHAT_ID'
ORDER BY created_at DESC;
```

---

**Ready to implement?** Start with GroupChatRoom.tsx → Test with real match creation → Then add DirectMessageThread.tsx

You have 2 days. Backend is COMPLETE. Focus on UI components!
