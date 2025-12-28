# 🚀 QUICK REFERENCE CARD

## Essential Commands

### Create Post
```typescript
import communityPostService from './services/communityPostService';

await communityPostService.post.createPost({
  content: 'Your post text here #hashtag',
  category: 'sports', // or 'gaming', 'events', 'parties', 'general'
  location: 'Mumbai'
});
```

### Upload Media
```typescript
import mediaUploadService from './services/mediaUploadService';

await mediaUploadService.uploadMedia(file, postId, 0);
```

### Like/Unlike
```typescript
await communityPostService.like.likePost(postId);
await communityPostService.like.unlikePost(postId);
```

### Comment
```typescript
await communityPostService.comment.createComment({
  post_id: postId,
  content: 'Nice post!'
});
```

### Follow/Unfollow
```typescript
await communityPostService.follow.followUser(userId);
await communityPostService.follow.unfollowUser(userId);
```

### Get Feed
```typescript
const feed = await communityPostService.post.getFeed({
  category: 'sports',
  limit: 20,
  offset: 0,
  sort_by: 'latest' // or 'popular', 'trending'
});
```

### Real-time Subscribe
```typescript
const unsubscribe = communityPostService.realtime.subscribeToFeed(
  'sports',
  (newPost) => console.log('New post:', newPost)
);
// Later: unsubscribe();
```

---

## Component Usage

```typescript
import { EnhancedCommunityFeed } from './components/EnhancedCommunityFeed';

<EnhancedCommunityFeed 
  onNavigate={handleNavigate}
  category="sports"  // Optional
/>
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `community_posts` | Main posts |
| `post_media` | Photos/videos |
| `post_comments` | Comments |
| `post_likes` | Likes |
| `user_follows` | Follow relationships |
| `post_invites` | Event invites |
| `post_bookmarks` | Saved posts |
| `post_shares` | Shared posts |
| `hashtags` | Trending tags |

---

## File Limits

- **Images**: 10MB max (JPEG, PNG, GIF, WebP)
- **Videos**: 100MB max (MP4, WebM)
- **Media per post**: 4 max

---

## Useful SQL Queries

### View All Posts
```sql
SELECT * FROM community_posts 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 20;
```

### Trending Hashtags
```sql
SELECT * FROM get_trending_hashtags(7, 10);
```

### User Stats
```sql
SELECT * FROM get_user_activity_summary('user-uuid');
```

---

## Common Issues

### Posts not showing
- Check if profile exists
- Verify RLS policies
- Check authentication

### Media upload fails
- Check bucket exists
- Verify file size
- Check storage policies

### Real-time not working
- Enable Realtime in Supabase
- Verify subscriptions cleanup

---

## Support Files

- 📖 **Setup**: `docs/COMMUNITY_BACKEND_SETUP.md`
- 📝 **Examples**: `src/examples/CommunityBackendExamples.tsx`
- ✅ **Checklist**: `DEPLOYMENT_CHECKLIST.md`
- 📊 **Overview**: `COMMUNITY_BACKEND_COMPLETE.md`

---

**Keep this handy while developing! 📌**
