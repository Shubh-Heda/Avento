# ✅ DEPLOYMENT CHECKLIST

Use this checklist to deploy the community backend to your HOPE platform.

---

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Have Supabase account
- [ ] Project created
- [ ] Supabase URL and API keys ready
- [ ] Environment variables set in `.env`

### 2. Dependencies Installed
```bash
npm install @supabase/supabase-js
```

---

## 🗄️ Database Setup

### Step 1: Run Main Migration
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy content from `supabase/migrations/002_community_posts.sql`
- [ ] Click "Run"
- [ ] Verify no errors

### Step 2: Run Functions Migration (Optional but Recommended)
- [ ] Copy content from `supabase/migrations/003_community_functions.sql`
- [ ] Run in SQL Editor
- [ ] Verify functions created

### Step 3: Verify Tables Created
Run this query:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE '%post%' OR tablename LIKE 'profile%' OR tablename = 'hashtags');
```

Expected results:
- [ ] profiles
- [ ] community_posts
- [ ] post_media
- [ ] post_comments
- [ ] post_likes
- [ ] user_follows
- [ ] post_shares
- [ ] post_invites
- [ ] post_bookmarks
- [ ] hashtags

---

## 📦 Storage Setup

### Step 1: Create Storage Bucket
- [ ] Go to Storage in Supabase Dashboard
- [ ] Click "New bucket"
- [ ] Name: `community-posts`
- [ ] Set as **Public**
- [ ] Click Create

### Step 2: Set Storage Policies
Copy and run this in SQL Editor:
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

- [ ] Storage policies created successfully

---

## 🔐 Authentication Setup

### Step 1: Enable Auth Providers
- [ ] Go to Authentication → Providers
- [ ] Enable Email/Password
- [ ] (Optional) Enable social providers (Google, GitHub, etc.)

### Step 2: Configure Profile Creation
Add this to your signup flow:
```typescript
import communityPostService from './services/communityPostService';
import { supabase } from './lib/supabase';

// After user signs up
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  await communityPostService.profile.upsertProfile({
    user_id: user.id,
    username: user.email?.split('@')[0] || 'user',
    display_name: user.email?.split('@')[0] || 'User',
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
  });
}
```

- [ ] Profile creation integrated in signup

---

## 🧪 Testing Phase

### Test 1: Database Connection
```typescript
import { supabase } from './lib/supabase';

// Test query
const { data, error } = await supabase.from('profiles').select('*').limit(1);
console.log('Database connected:', !error);
```
- [ ] Database connection works

### Test 2: Create Profile
```typescript
import communityPostService from './services/communityPostService';

const profile = await communityPostService.profile.upsertProfile({
  user_id: 'test-user-id',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'Testing the backend!'
});
console.log('Profile created:', profile);
```
- [ ] Profile creation works

### Test 3: Create Post
```typescript
const post = await communityPostService.post.createPost({
  content: 'My first test post! #test',
  category: 'general',
  location: 'Mumbai'
});
console.log('Post created:', post);
```
- [ ] Post creation works

### Test 4: Upload Media
```typescript
// Create a file input and select an image
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const result = await mediaUploadService.uploadMedia(file, postId, 0);
console.log('Media uploaded:', result);
```
- [ ] Media upload works
- [ ] Media URL accessible
- [ ] Image displays correctly

### Test 5: Like Post
```typescript
const success = await communityPostService.like.likePost(postId);
console.log('Like successful:', success);
```
- [ ] Like functionality works
- [ ] Like count increments

### Test 6: Comment
```typescript
const comment = await communityPostService.comment.createComment({
  post_id: postId,
  content: 'Great post!'
});
console.log('Comment created:', comment);
```
- [ ] Comment creation works
- [ ] Comment count increments

### Test 7: Real-time Updates
```typescript
const unsubscribe = communityPostService.realtime.subscribeToFeed(
  'general',
  (newPost) => {
    console.log('New post received:', newPost);
  }
);

// Create a post in another tab/window and verify it appears
```
- [ ] Real-time subscriptions work
- [ ] New posts appear instantly

---

## 🎨 UI Integration

### Step 1: Import Component
```typescript
import { EnhancedCommunityFeed } from './components/EnhancedCommunityFeed';
```
- [ ] Component imports without errors

### Step 2: Add to Router/Navigation
```typescript
{currentPage === 'community' && (
  <EnhancedCommunityFeed 
    onNavigate={handleNavigate}
    category="sports"  // Or leave undefined for all categories
  />
)}
```
- [ ] Component renders
- [ ] Navigation works
- [ ] No console errors

### Step 3: Test UI Features
- [ ] Create post button works
- [ ] Modal opens/closes
- [ ] Text input works
- [ ] File upload button works
- [ ] File preview shows
- [ ] Post button submits
- [ ] Posts display in feed
- [ ] Like button works (with animation)
- [ ] Comment button expands section
- [ ] Share button present
- [ ] Bookmark button present
- [ ] Timestamps display correctly
- [ ] User avatars show
- [ ] Media displays (images/videos)

---

## 🔍 Verification

### Database Verification
Run these queries to verify data:

```sql
-- Check profiles
SELECT COUNT(*) FROM profiles;

-- Check posts
SELECT COUNT(*) FROM community_posts;

-- Check media
SELECT COUNT(*) FROM post_media;

-- Check engagement
SELECT 
  SUM(like_count) as total_likes,
  SUM(comment_count) as total_comments,
  SUM(share_count) as total_shares
FROM community_posts;
```

- [ ] All counts are correct
- [ ] No orphaned records

### Storage Verification
- [ ] Go to Storage → community-posts
- [ ] Files visible
- [ ] Public URLs work
- [ ] Thumbnails generated (for videos)

---

## 🚀 Performance Checks

### Page Load Time
- [ ] Feed loads in < 2 seconds
- [ ] Images load progressively
- [ ] No blocking operations

### Real-time Performance
- [ ] New posts appear within 1 second
- [ ] No lag in UI
- [ ] Subscriptions cleanup on unmount

### Mobile Responsiveness
- [ ] Works on mobile devices
- [ ] Images resize properly
- [ ] Buttons are touch-friendly

---

## 🔒 Security Audit

### RLS (Row Level Security)
Run this query to verify RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%post%';
```
- [ ] All tables have rowsecurity = true

### Test Unauthorized Access
- [ ] Try accessing posts without authentication (should fail)
- [ ] Try modifying another user's post (should fail)
- [ ] Try uploading without authentication (should fail)

---

## 📊 Monitoring Setup

### Error Tracking
- [ ] Set up error logging for API calls
- [ ] Monitor Supabase logs in dashboard
- [ ] Add console.error for debugging

### Analytics (Optional)
- [ ] Track post creation rate
- [ ] Monitor storage usage
- [ ] Track active users

---

## 📝 Documentation Review

- [ ] Read `COMMUNITY_BACKEND_COMPLETE.md`
- [ ] Read `docs/COMMUNITY_BACKEND_SETUP.md`
- [ ] Review examples in `src/examples/CommunityBackendExamples.tsx`
- [ ] Understand database schema in `002_community_posts.sql`

---

## ✅ Final Checks

### Code Quality
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] All imports resolve
- [ ] Proper error handling

### User Experience
- [ ] Loading states show
- [ ] Error messages display
- [ ] Success feedback given
- [ ] Smooth animations

### Production Readiness
- [ ] Environment variables set
- [ ] API keys secured (not in code)
- [ ] Database backups enabled
- [ ] Rate limiting configured

---

## 🎉 Launch!

Once all items are checked:
- [ ] Deploy to production
- [ ] Test with real users
- [ ] Monitor for issues
- [ ] Gather feedback

---

## 🆘 Troubleshooting

### If posts don't show:
1. Check if user has profile created
2. Verify RLS policies
3. Check browser console for errors
4. Verify Supabase credentials

### If media upload fails:
1. Check bucket exists and is public
2. Verify file size (max 10MB images, 100MB videos)
3. Check storage policies
4. Verify CORS settings

### If real-time doesn't work:
1. Check Realtime is enabled in Supabase
2. Verify subscription cleanup
3. Check browser console for connection errors

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Database Logs**: Supabase Dashboard → Logs
- **Storage Logs**: Supabase Dashboard → Storage → Logs
- **API Reference**: `docs/COMMUNITY_BACKEND_SETUP.md`

---

**Ready to launch! 🚀**

Mark all items as you complete them. Good luck! 🎊
