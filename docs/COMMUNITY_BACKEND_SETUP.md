# 🚀 Community Feed Backend - Setup Guide

## Overview
A complete Twitter-like community feed backend built with Supabase, featuring posts, media uploads (photos/videos), comments, likes, follows, invites, and real-time updates.

---

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Storage Setup](#storage-setup)
3. [Authentication Setup](#authentication-setup)
4. [Testing the Backend](#testing-the-backend)
5. [Component Integration](#component-integration)
6. [API Reference](#api-reference)

---

## 🗄️ Database Setup

### Step 1: Run Migration

```bash
# Navigate to your project
cd "c:\Users\Shubh Heda\OneDrive\Desktop\hope"

# Apply migration using Supabase CLI
supabase db push
```

Or manually in Supabase Dashboard:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to SQL Editor
4. Copy contents of `supabase/migrations/002_community_posts.sql`
5. Run the migration

### Step 2: Verify Tables Created

Run this query to verify:
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%post%' OR tablename LIKE 'profile%';
```

Expected tables:
- ✅ profiles
- ✅ community_posts
- ✅ post_media
- ✅ post_comments
- ✅ post_likes
- ✅ user_follows
- ✅ post_shares
- ✅ post_invites
- ✅ post_bookmarks
- ✅ hashtags

---

## 📦 Storage Setup

### Step 1: Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Create new bucket named: `community-posts`
3. Set to **Public** (for easy media access)

### Step 2: Set Storage Policies

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-posts');

-- Allow public read access
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-posts');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'community-posts' AND owner = auth.uid());
```

---

## 🔐 Authentication Setup

### Step 1: Ensure Auth is Enabled

In Supabase Dashboard → Authentication → Providers:
- ✅ Email/Password enabled
- ✅ (Optional) Social providers (Google, GitHub, etc.)

### Step 2: Create Initial Profile

After a user signs up, create their profile:

```typescript
import { supabase } from './lib/supabase';
import communityPostService from './services/communityPostService';

// After signup/login
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  await communityPostService.profile.upsertProfile({
    user_id: user.id,
    username: 'unique_username', // Make sure it's unique
    display_name: 'John Doe',
    bio: 'Love sports and gaming!',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
  });
}
```

---

## 🧪 Testing the Backend

### Test 1: Create a Post

```typescript
import communityPostService from './services/communityPostService';

const newPost = await communityPostService.post.createPost({
  content: 'My first post! #sports #cricket',
  category: 'sports',
  location: 'Mumbai, India',
  is_public: true
});

console.log('Post created:', newPost);
```

### Test 2: Upload Media

```typescript
import mediaUploadService from './services/mediaUploadService';

// Assuming you have a file input
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const result = await mediaUploadService.uploadMedia(file, newPost.id, 0);
console.log('Media uploaded:', result);
```

### Test 3: Like a Post

```typescript
const success = await communityPostService.like.likePost(postId);
console.log('Liked:', success);
```

### Test 4: Add a Comment

```typescript
const comment = await communityPostService.comment.createComment({
  post_id: postId,
  content: 'Great post!'
});
console.log('Comment added:', comment);
```

### Test 5: Real-time Updates

```typescript
// Subscribe to new posts
const unsubscribe = communityPostService.realtime.subscribeToFeed(
  'sports',
  (newPost) => {
    console.log('New post received:', newPost);
  }
);

// Cleanup when done
unsubscribe();
```

---

## 🔌 Component Integration

### Replace Old CommunityFeed

In your main App component:

```typescript
// Before
import { CommunityFeed } from './components/CommunityFeed';

// After
import { EnhancedCommunityFeed } from './components/EnhancedCommunityFeed';

// Usage
<EnhancedCommunityFeed 
  onNavigate={handleNavigate}
  category="sports"  // Optional: filter by category
/>
```

### Category-Specific Feeds

```typescript
// Sports Community
<EnhancedCommunityFeed onNavigate={handleNavigate} category="sports" />

// Gaming Community
<EnhancedCommunityFeed onNavigate={handleNavigate} category="gaming" />

// Events Community
<EnhancedCommunityFeed onNavigate={handleNavigate} category="events" />

// Parties Community
<EnhancedCommunityFeed onNavigate={handleNavigate} category="parties" />

// General Feed (all categories)
<EnhancedCommunityFeed onNavigate={handleNavigate} />
```

---

## 📚 API Reference

### Profile Operations

```typescript
// Get profile
const profile = await communityPostService.profile.getProfile(userId);

// Get by username
const profile = await communityPostService.profile.getProfileByUsername('john_doe');

// Update profile
await communityPostService.profile.upsertProfile({
  user_id: userId,
  bio: 'Updated bio',
  location: 'New Delhi'
});

// Search profiles
const results = await communityPostService.profile.searchProfiles('john', 20);
```

### Post Operations

```typescript
// Get feed
const feed = await communityPostService.post.getFeed({
  category: 'sports',
  limit: 20,
  offset: 0,
  sort_by: 'latest' // 'latest' | 'popular' | 'trending'
});

// Get single post
const post = await communityPostService.post.getPost(postId);

// Create post
const post = await communityPostService.post.createPost({
  content: 'Post content',
  category: 'sports',
  location: 'Mumbai',
  tags: ['cricket', 'sports']
});

// Update post
await communityPostService.post.updatePost(postId, {
  content: 'Updated content'
});

// Delete post
await communityPostService.post.deletePost(postId);
```

### Comment Operations

```typescript
// Get comments
const comments = await communityPostService.comment.getComments(postId);

// Create comment
const comment = await communityPostService.comment.createComment({
  post_id: postId,
  content: 'Nice post!',
  parent_comment_id: null // For replies, pass parent comment ID
});

// Delete comment
await communityPostService.comment.deleteComment(commentId);
```

### Like Operations

```typescript
// Like post
await communityPostService.like.likePost(postId);

// Unlike post
await communityPostService.like.unlikePost(postId);

// Like comment
await communityPostService.like.likeComment(commentId);

// Unlike comment
await communityPostService.like.unlikeComment(commentId);
```

### Follow Operations

```typescript
// Follow user
await communityPostService.follow.followUser(userId);

// Unfollow user
await communityPostService.follow.unfollowUser(userId);

// Get followers
const followers = await communityPostService.follow.getFollowers(userId);

// Get following
const following = await communityPostService.follow.getFollowing(userId);

// Check if following
const isFollowing = await communityPostService.follow.isFollowing(followerId, followingId);
```

### Invite Operations

```typescript
// Invite users to post/event
await communityPostService.invite.inviteUsers(
  postId, 
  [userId1, userId2], 
  'Join us!'
);

// Respond to invite
await communityPostService.invite.respondToInvite(inviteId, 'accepted');

// Get pending invites
const invites = await communityPostService.invite.getPendingInvites(userId);
```

### Bookmark Operations

```typescript
// Bookmark post
await communityPostService.bookmark.bookmarkPost(postId);

// Remove bookmark
await communityPostService.bookmark.removeBookmark(postId);

// Get bookmarks
const bookmarks = await communityPostService.bookmark.getBookmarks(userId);
```

### Media Upload Operations

```typescript
// Upload single media
const result = await mediaUploadService.uploadMedia(file, postId, 0);

// Upload multiple media
const results = await mediaUploadService.uploadMultipleMedia([file1, file2], postId);

// Delete media
await mediaUploadService.deleteMedia(mediaId);

// Get post media
const media = await mediaUploadService.getPostMedia(postId);

// Validate file
const validation = mediaUploadService.validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

---

## 🎯 Features Implemented

### ✅ Core Features
- [x] Create posts with text content
- [x] Upload photos (JPEG, PNG, GIF, WebP)
- [x] Upload videos (MP4, WebM)
- [x] Like/unlike posts
- [x] Comment on posts
- [x] Nested replies
- [x] Follow/unfollow users
- [x] Bookmark posts
- [x] Share posts
- [x] Invite users to posts/events
- [x] Real-time updates
- [x] Category filtering
- [x] Hashtag support
- [x] User mentions
- [x] Location tagging

### ✅ Advanced Features
- [x] Auto-incrementing counters (likes, comments, shares)
- [x] Video thumbnails
- [x] Image dimensions
- [x] File validation
- [x] Soft deletes
- [x] Row-level security (RLS)
- [x] Database triggers
- [x] Real-time subscriptions

---

## 🔧 Environment Setup

Make sure your `.env` file has Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📈 Performance Considerations

1. **Pagination**: Use offset/limit for loading posts
2. **Indexes**: All foreign keys are indexed
3. **Caching**: Consider caching frequently accessed data
4. **Image Optimization**: Compress images before upload
5. **Video Processing**: Consider transcoding videos server-side

---

## 🐛 Troubleshooting

### Issue: Posts not showing
- Check if user has a profile created
- Verify RLS policies are enabled
- Check browser console for errors

### Issue: Media upload fails
- Verify storage bucket exists and is public
- Check file size limits (10MB images, 100MB videos)
- Ensure correct MIME types

### Issue: Real-time not working
- Check Supabase Realtime is enabled in dashboard
- Verify subscription cleanup on component unmount

---

## 🚀 Next Steps

1. **Add Search**: Implement full-text search on posts
2. **Notifications**: Alert users of likes, comments, mentions
3. **Analytics**: Track post views and engagement
4. **Moderation**: Add reporting and content moderation
5. **Rich Media**: Support for GIFs, polls, rich embeds

---

## 📞 Support

For issues or questions:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review database logs in Supabase Dashboard
3. Check browser console for errors

---

**Backend is now ready! Start creating posts, uploading media, and building your community! 🎉**
