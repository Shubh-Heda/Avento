// ============================================
// Community System Types
// ============================================

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  location?: string;
  website?: string;
  verified: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  category: 'sports' | 'events' | 'parties' | 'gaming' | 'general';
  content: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  is_pinned: boolean;
  is_public: boolean;
  tags?: string[];
  mentions?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Populated fields (from joins)
  author?: Profile;
  media?: PostMedia[];
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
}

export interface PostMedia {
  id: string;
  post_id: string;
  media_type: 'photo' | 'video' | 'gif';
  media_url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number; // in seconds for videos
  file_size?: number; // in bytes
  mime_type?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  display_order: number;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id?: string;
  content: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Populated fields
  author?: Profile;
  replies?: PostComment[];
  user_has_liked?: boolean;
}

export interface PostLike {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface PostShare {
  id: string;
  user_id: string;
  post_id: string;
  comment?: string;
  created_at: string;
  
  // Populated fields
  user?: Profile;
  post?: CommunityPost;
}

export interface PostInvite {
  id: string;
  post_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  responded_at?: string;
  
  // Populated fields
  inviter?: Profile;
  post?: CommunityPost;
}

export interface PostBookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  
  // Populated fields
  post?: CommunityPost;
}

export interface Hashtag {
  id: string;
  tag: string;
  usage_count: number;
  created_at: string;
  last_used_at: string;
}

// ============================================
// Request/Response Types
// ============================================

export interface CreatePostRequest {
  content: string;
  category?: 'sports' | 'events' | 'parties' | 'gaming' | 'general';
  location?: string;
  latitude?: number;
  longitude?: number;
  is_public?: boolean;
  tags?: string[];
  mentions?: string[];
  media_files?: File[]; // For file uploads
}

export interface UpdatePostRequest {
  content?: string;
  location?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface CreateCommentRequest {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface FeedQuery {
  category?: 'sports' | 'events' | 'parties' | 'gaming' | 'general';
  author_id?: string;
  following_only?: boolean;
  limit?: number;
  offset?: number;
  sort_by?: 'latest' | 'popular' | 'trending';
}

export interface MediaUploadResponse {
  media_id: string;
  media_url: string;
  thumbnail_url?: string;
  processing_status: string;
}

// ============================================
// Feed Response Type
// ============================================

export interface FeedResponse {
  posts: CommunityPost[];
  has_more: boolean;
  total_count: number;
}
