// ============================================
// Quick Start Example - Community Feed Backend
// ============================================
// This file shows you how to integrate the community backend
// into your existing components

import { useState, useEffect } from 'react';
import communityPostService from './services/communityPostService';
import mediaUploadService from './services/mediaUploadService';
import { EnhancedCommunityFeed } from './components/EnhancedCommunityFeed';

// ============================================
// EXAMPLE 1: Creating a Post
// ============================================

async function createPostExample() {
  try {
    // Simple text post
    const post = await communityPostService.post.createPost({
      content: 'Just finished an amazing cricket match! 🏏 #cricket #sports',
      category: 'sports',
      location: 'Andheri Sports Complex, Mumbai'
    });

    console.log('Post created:', post);
    return post;
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

// ============================================
// EXAMPLE 2: Creating a Post with Media
// ============================================

async function createPostWithMedia(files: File[]) {
  try {
    // Step 1: Create the post
    const post = await communityPostService.post.createPost({
      content: 'Check out these highlights from today\'s game! 🎮',
      category: 'gaming',
      tags: ['gaming', 'highlights', 'fps']
    });

    if (!post) {
      throw new Error('Failed to create post');
    }

    // Step 2: Upload media files
    const mediaResults = await mediaUploadService.uploadMultipleMedia(files, post.id);
    
    console.log('Post with media created:', post, mediaResults);
    return post;
  } catch (error) {
    console.error('Error creating post with media:', error);
  }
}

// ============================================
// EXAMPLE 3: Complete Component Integration
// ============================================

export function MyCustomCommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
    
    // Subscribe to real-time updates
    const unsubscribe = communityPostService.realtime.subscribeToFeed(
      'sports',
      (newPost) => {
        setPosts(prev => [newPost, ...prev]);
      }
    );

    return () => unsubscribe();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const response = await communityPostService.post.getFeed({
        category: 'sports',
        limit: 20,
        sort_by: 'latest'
      });
      setPosts(response.posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(postId: string) {
    try {
      await communityPostService.like.likePost(postId);
      // Refresh posts to update like count
      await loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  async function handleComment(postId: string, content: string) {
    try {
      await communityPostService.comment.createComment({
        post_id: postId,
        content: content
      });
      // Refresh posts to update comment count
      await loadPosts();
    } catch (error) {
      console.error('Error commenting:', error);
    }
  }

  return (
    <div>
      <h1>Sports Community</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id}>
              {/* Your post card UI here */}
              <h3>{post.author?.display_name}</h3>
              <p>{post.content}</p>
              <button onClick={() => handleLike(post.id)}>
                Like ({post.like_count})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 4: Using the Enhanced Feed Component
// ============================================

export function AppWithCommunityFeed() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <div>
      {currentPage === 'community' ? (
        <EnhancedCommunityFeed 
          onNavigate={handleNavigate}
          category="sports" // Optional: filter by category
        />
      ) : (
        <div>Dashboard content...</div>
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 5: Profile Setup on Sign Up
// ============================================

async function setupUserProfile(userId: string, email: string) {
  try {
    // Create profile after user signs up
    const profile = await communityPostService.profile.upsertProfile({
      user_id: userId,
      username: email.split('@')[0], // Use email prefix as username
      display_name: email.split('@')[0],
      bio: '',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    });

    console.log('Profile created:', profile);
    return profile;
  } catch (error) {
    console.error('Error creating profile:', error);
  }
}

// ============================================
// EXAMPLE 6: Following Users
// ============================================

async function followUserExample(userIdToFollow: string) {
  try {
    const success = await communityPostService.follow.followUser(userIdToFollow);
    
    if (success) {
      console.log('Successfully followed user');
    }
  } catch (error) {
    console.error('Error following user:', error);
  }
}

// ============================================
// EXAMPLE 7: Inviting Users to an Event Post
// ============================================

async function inviteUsersToEvent(postId: string, userIds: string[]) {
  try {
    const success = await communityPostService.invite.inviteUsers(
      postId,
      userIds,
      'Join us for an epic cricket match this Saturday!'
    );

    if (success) {
      console.log('Invites sent successfully');
    }
  } catch (error) {
    console.error('Error sending invites:', error);
  }
}

// ============================================
// EXAMPLE 8: Complete Post Creation Flow
// ============================================

export function CreatePostForm() {
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validation = mediaUploadService.validateFiles(files);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter some content');
      return;
    }

    try {
      setIsPosting(true);

      // Create post
      const post = await communityPostService.post.createPost({
        content: content,
        category: 'sports',
        location: location || undefined,
        is_public: true
      });

      if (!post) {
        throw new Error('Failed to create post');
      }

      // Upload media if any
      if (selectedFiles.length > 0) {
        await mediaUploadService.uploadMultipleMedia(selectedFiles, post.id);
      }

      // Reset form
      setContent('');
      setLocation('');
      setSelectedFiles([]);
      
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        rows={4}
      />
      
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Add location (optional)"
      />
      
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />
      
      {selectedFiles.length > 0 && (
        <div>Selected: {selectedFiles.length} files</div>
      )}
      
      <button type="submit" disabled={isPosting}>
        {isPosting ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 9: Search and Invite Users
// ============================================

export function UserSearchAndInvite({ postId }: { postId: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await communityPostService.profile.searchProfiles(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to invite');
      return;
    }

    try {
      await communityPostService.invite.inviteUsers(
        postId,
        selectedUsers,
        'Join us!'
      );
      alert('Invites sent!');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error inviting:', error);
    }
  };

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search users..."
      />
      <button onClick={handleSearch}>Search</button>

      <div>
        {searchResults.map((user) => (
          <div key={user.id}>
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedUsers([...selectedUsers, user.id]);
                } else {
                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                }
              }}
            />
            {user.display_name} (@{user.username})
          </div>
        ))}
      </div>

      <button onClick={handleInvite}>Send Invites</button>
    </div>
  );
}

// ============================================
// EXPORT ALL EXAMPLES
// ============================================

export {
  createPostExample,
  createPostWithMedia,
  setupUserProfile,
  followUserExample,
  inviteUsersToEvent
};
