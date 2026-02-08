// ============================================
// Real Community Service - Twitter-like Backend
// ============================================
import { supabase } from '../lib/supabase';
import { firebaseAuth } from './firebaseService';
import type {
  CommunityPost,
  PostComment,
  Profile,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  FeedQuery,
  FeedResponse,
  PostMedia,
  PostInvite,
  UserFollow,
  PostBookmark
} from '../types/community';

// ============================================
// PROFILE OPERATIONS
// ============================================

export const profileOperations = {
  /**
   * Get a profile by user ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },

  /**
   * Get a profile by username
   */
  async getProfileByUsername(username: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }
  },

  /**
   * Create or update a profile
   */
  async upsertProfile(profile: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting profile:', error);
      return null;
    }
  },

  /**
   * Search profiles by username or display name
   */
  async searchProfiles(query: string, limit = 20): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }
};

// ============================================
// POST OPERATIONS
// ============================================

export const postOperations = {
  /**
   * Get feed posts with filters
   */
  async getFeed(query: FeedQuery = {}): Promise<FeedResponse> {
    try {
      const {
        category,
        author_id,
        following_only = false,
        limit = 20,
        offset = 0,
        sort_by = 'latest'
      } = query;

      let queryBuilder = supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey(*),
          media:post_media(*)
        `, { count: 'exact' })
        .is('deleted_at', null)
        .range(offset, offset + limit - 1);

      // Apply filters
      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      if (author_id) {
        queryBuilder = queryBuilder.eq('author_id', author_id);
      }

      if (following_only) {
        const user = firebaseAuth.getCurrentUser();
        if (user) {
          const { data: following } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);
          
          if (following && following.length > 0) {
            const followingIds = following.map(f => f.following_id);
            queryBuilder = queryBuilder.in('author_id', followingIds);
          }
        }
      }

      // Apply sorting
      switch (sort_by) {
        case 'popular':
          queryBuilder = queryBuilder.order('like_count', { ascending: false });
          break;
        case 'trending':
          queryBuilder = queryBuilder.order('view_count', { ascending: false });
          break;
        case 'latest':
        default:
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
      }

      const { data, error, count } = await queryBuilder;

      if (error) throw error;

      // Check if current user has liked each post
      const user = firebaseAuth.getCurrentUser();
      let postsWithLikeStatus = data || [];

      if (user && postsWithLikeStatus.length > 0) {
        const postIds = postsWithLikeStatus.map(p => p.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
        postsWithLikeStatus = postsWithLikeStatus.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id)
        }));
      }

      return {
        posts: postsWithLikeStatus,
        has_more: (count || 0) > offset + limit,
        total_count: count || 0
      };
    } catch (error) {
      console.error('Error fetching feed:', error);
      return { posts: [], has_more: false, total_count: 0 };
    }
  },

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<CommunityPost | null> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey(*),
          media:post_media(*)
        `)
        .eq('id', postId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('community_posts')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', postId);

      return data;
    } catch (error) {
      console.error('Error fetching post:', error);
      return null;
    }
  },

  /**
   * Create a new post
   */
  async createPost(request: CreatePostRequest): Promise<CommunityPost | null> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's profile
      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: profile.id,
          content: request.content,
          category: request.category || 'general',
          location: request.location,
          latitude: request.latitude,
          longitude: request.longitude,
          is_public: request.is_public ?? true,
          tags: request.tags || [],
          mentions: request.mentions || []
        })
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      // Extract and save hashtags
      if (request.tags && request.tags.length > 0) {
        await this.updateHashtags(request.tags);
      }

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  },

  /**
   * Update a post
   */
  async updatePost(postId: string, request: UpdatePostRequest): Promise<CommunityPost | null> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .update({
          content: request.content,
          location: request.location,
          is_public: request.is_public,
          tags: request.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey(*),
          media:post_media(*)
        `)
        .single();

      if (error) throw error;

      if (request.tags) {
        await this.updateHashtags(request.tags);
      }

      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      return null;
    }
  },

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  },

  /**
   * Update hashtags usage
   */
  async updateHashtags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const cleanTag = tag.toLowerCase().replace('#', '');
        await supabase.rpc('increment_hashtag_usage', { tag_name: cleanTag });
      }
    } catch (error) {
      console.error('Error updating hashtags:', error);
    }
  }
};

// ============================================
// COMMENT OPERATIONS
// ============================================

export const commentOperations = {
  /**
   * Get comments for a post
   */
  async getComments(postId: string, limit = 50): Promise<PostComment[]> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(*)
        `)
        .eq('post_id', postId)
        .is('deleted_at', null)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const replies = await this.getReplies(comment.id);
          return { ...comment, replies };
        })
      );

      return commentsWithReplies;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  /**
   * Get replies to a comment
   */
  async getReplies(commentId: string): Promise<PostComment[]> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(*)
        `)
        .eq('parent_comment_id', commentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  },

  /**
   * Create a comment
   */
  async createComment(request: CreateCommentRequest): Promise<PostComment | null> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: request.post_id,
          author_id: profile.id,
          content: request.content,
          parent_comment_id: request.parent_comment_id
        })
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }
};

// ============================================
// LIKE OPERATIONS
// ============================================

export const likeOperations = {
  /**
   * Like a post
   */
  async likePost(postId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('post_likes')
        .insert({
          user_id: profile.id,
          post_id: postId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', profile.id)
        .eq('post_id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  },

  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('post_likes')
        .insert({
          user_id: profile.id,
          comment_id: commentId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error liking comment:', error);
      return false;
    }
  },

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', profile.id)
        .eq('comment_id', commentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unliking comment:', error);
      return false;
    }
  }
};

// ============================================
// FOLLOW OPERATIONS
// ============================================

export const followOperations = {
  /**
   * Follow a user
   */
  async followUser(followingId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: profile.id,
          following_id: followingId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(followingId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', profile.id)
        .eq('following_id', followingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  },

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, limit = 50): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('follower:profiles!user_follows_follower_id_fkey(*)')
        .eq('following_id', userId)
        .limit(limit);

      if (error) throw error;
      return (data?.map((d: any) => d.follower) as Profile[]) || [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  },

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, limit = 50): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('following:profiles!user_follows_following_id_fkey(*)')
        .eq('follower_id', userId)
        .limit(limit);

      if (error) throw error;
      return (data?.map((d: any) => d.following) as Profile[]) || [];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  },

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }
};

// ============================================
// INVITE OPERATIONS
// ============================================

export const inviteOperations = {
  /**
   * Invite users to a post/event
   */
  async inviteUsers(postId: string, userIds: string[], message?: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const invites = userIds.map(userId => ({
        post_id: postId,
        inviter_id: profile.id,
        invitee_id: userId,
        message: message || null,
        status: 'pending' as const
      }));

      const { error } = await supabase
        .from('post_invites')
        .insert(invites);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error inviting users:', error);
      return false;
    }
  },

  /**
   * Respond to an invite
   */
  async respondToInvite(inviteId: string, status: 'accepted' | 'declined'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('post_invites')
        .update({
          status,
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error responding to invite:', error);
      return false;
    }
  },

  /**
   * Get user's pending invites
   */
  async getPendingInvites(userId: string): Promise<PostInvite[]> {
    try {
      const { data, error } = await supabase
        .from('post_invites')
        .select(`
          *,
          inviter:profiles!post_invites_inviter_id_fkey(*),
          post:community_posts(*)
        `)
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching invites:', error);
      return [];
    }
  }
};

// ============================================
// BOOKMARK OPERATIONS
// ============================================

export const bookmarkOperations = {
  /**
   * Bookmark a post
   */
  async bookmarkPost(postId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('post_bookmarks')
        .insert({
          user_id: profile.id,
          post_id: postId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bookmarking post:', error);
      return false;
    }
  },

  /**
   * Remove bookmark
   */
  async removeBookmark(postId: string): Promise<boolean> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const profile = await profileOperations.getProfile(user.id);
      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('user_id', profile.id)
        .eq('post_id', postId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  },

  /**
   * Get user's bookmarks
   */
  async getBookmarks(userId: string, limit = 50): Promise<PostBookmark[]> {
    try {
      const { data, error } = await supabase
        .from('post_bookmarks')
        .select(`
          *,
          post:community_posts(
            *,
            author:profiles!community_posts_author_id_fkey(*),
            media:post_media(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  }
};

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export const realtimeOperations = {
  /**
   * Subscribe to new posts in feed
   */
  subscribeToFeed(category: string | null, callback: (post: CommunityPost) => void) {
    let channel = supabase
      .channel('community_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: category ? `category=eq.${category}` : undefined
        },
        async (payload) => {
          // Fetch full post data with author info
          const post = await postOperations.getPost(payload.new.id);
          if (post) callback(post);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to comments on a post
   */
  subscribeToComments(postId: string, callback: (comment: PostComment) => void) {
    let channel = supabase
      .channel(`post_comments_${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          // Fetch full comment with author
          const { data } = await supabase
            .from('post_comments')
            .select('*, author:profiles!post_comments_author_id_fkey(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) callback(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};

// ============================================
// Export all operations as a single service
// ============================================

export const communityPostService = {
  profile: profileOperations,
  post: postOperations,
  comment: commentOperations,
  like: likeOperations,
  follow: followOperations,
  invite: inviteOperations,
  bookmark: bookmarkOperations,
  realtime: realtimeOperations
};

export default communityPostService;
