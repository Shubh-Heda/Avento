// ============================================
// Enhanced Community Feed with Real Backend
// Twitter-like feed with posts, media, comments
// ============================================
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  Send,
  UserPlus,
  MapPin,
  Clock,
  X,
  Upload,
  Play
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AnimatedBackground } from './AnimatedBackground';
import { ImageWithFallback } from './figma/ImageWithFallback';
import communityPostService from '../services/communityPostService';
import mediaUploadService from '../services/mediaUploadService';
import type { CommunityPost, PostComment, CreatePostRequest } from '../types/community';

interface EnhancedCommunityFeedProps {
  onNavigate: (page: string) => void;
  category?: 'sports' | 'events' | 'parties' | 'gaming' | 'general';
}

export function EnhancedCommunityFeed({ onNavigate, category }: EnhancedCommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, PostComment[]>>({});
  
  // Create post state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load feed
  const loadFeed = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(true);
      
      const response = await communityPostService.post.getFeed({
        category: category || undefined,
        limit: 20,
        offset: isLoadMore ? offset : 0,
        sort_by: 'latest'
      });

      if (isLoadMore) {
        setPosts(prev => [...prev, ...response.posts]);
        setOffset(prev => prev + response.posts.length);
      } else {
        setPosts(response.posts);
        setOffset(response.posts.length);
      }
      
      setHasMore(response.has_more);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  }, [category, offset]);

  useEffect(() => {
    // Reset and load when category changes
    setOffset(0);
    setPosts([]);
    
    const initialLoad = async () => {
      try {
        setLoading(true);
        
        const response = await communityPostService.post.getFeed({
          category: category || undefined,
          limit: 20,
          offset: 0,
          sort_by: 'latest'
        });

        setPosts(response.posts);
        setOffset(response.posts.length);
        setHasMore(response.has_more);
      } catch (error) {
        console.error('Error loading feed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialLoad();

    // Subscribe to real-time updates
    const unsubscribe = communityPostService.realtime.subscribeToFeed(
      category || null,
      (newPost) => {
        setPosts(prev => [newPost, ...prev]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [category]);

  // Load comments for a post
  const loadComments = async (postId: string) => {
    try {
      const postComments = await communityPostService.comment.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: postComments }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Handle like/unlike
  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await communityPostService.like.unlikePost(postId);
      } else {
        await communityPostService.like.likePost(postId);
      }
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              like_count: isLiked ? post.like_count - 1 : post.like_count + 1,
              user_has_liked: !isLiked 
            }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Handle comment toggle
  const handleCommentToggle = async (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
    } else {
      setSelectedPost(postId);
      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  // Handle share
  const handleShare = async (postId: string) => {
    try {
      await communityPostService.share.sharePost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, share_count: post.share_count + 1 }
          : post
      ));
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  // Handle bookmark
  const handleBookmark = async (postId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await communityPostService.bookmark.unbookmarkPost(postId);
      } else {
        await communityPostService.bookmark.bookmarkPost(postId);
      }
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, user_has_bookmarked: !isBookmarked }
          : post
      ));
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  // Handle invite
  const handleInvite = async (postId: string) => {
    const userIds = prompt('Enter user IDs to invite (comma-separated):');
    if (!userIds) return;
    
    try {
      const ids = userIds.split(',').map(id => id.trim());
      await communityPostService.invite.inviteUsers(postId, ids);
      alert(`Invited ${ids.length} users to this post!`);
    } catch (error) {
      console.error('Error inviting users:', error);
      alert('Failed to invite users');
    }
  };

  // Handle media selection
  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validation = mediaUploadService.validateFiles(files);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    setSelectedMedia(files);

    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setMediaPreview(previews);
  };

  // Remove media
  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(mediaPreview[index]);
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  // Create post
  const handleCreatePost = async () => {
    if (!postContent.trim()) return;

    try {
      setIsPosting(true);

      // Create post
      const newPost = await communityPostService.post.createPost({
        content: postContent,
        category: category || 'general',
        location: postLocation || undefined,
        is_public: true,
        tags: extractHashtags(postContent)
      });

      if (!newPost) throw new Error('Failed to create post');

      // Upload media if any
      if (selectedMedia.length > 0) {
        await mediaUploadService.uploadMultipleMedia(selectedMedia, newPost.id);
      }

      // Reset form
      setPostContent('');
      setPostLocation('');
      setSelectedMedia([]);
      setMediaPreview([]);
      setShowCreatePost(false);

      // Reload feed to show new post
      await loadFeed(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Extract hashtags from text
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatedBackground variant="community">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-xl font-bold">
                {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Community` : 'Community Feed'}
              </h1>
            </div>
            <Button onClick={() => setShowCreatePost(true)} className="gap-2">
              <Send className="w-4 h-4" />
              Post
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Create Post</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreatePost(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full min-h-[150px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                <input
                  type="text"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="Add location (optional)"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                {/* Media Preview */}
                {mediaPreview.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {mediaPreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        {selectedMedia[index].type.startsWith('video/') ? (
                          <div className="relative">
                            <video src={preview} className="w-full h-32 object-cover rounded-lg" />
                            <Play className="absolute inset-0 m-auto w-10 h-10 text-white" />
                          </div>
                        ) : (
                          <img src={preview} alt="" className="w-full h-32 object-cover rounded-lg" />
                        )}
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Media Upload Buttons */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                    disabled={selectedMedia.length >= 4}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Add Photo/Video
                  </Button>
                  <span className="text-sm text-slate-500">
                    {selectedMedia.length}/4 media
                  </span>
                </div>

                {/* Post Button */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || isPosting}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500"
                  >
                    {isPosting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">No posts yet. Be the first to post!</p>
              <Button onClick={() => setShowCreatePost(true)}>Create Post</Button>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <img
                      src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`}
                      alt={post.author?.display_name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{post.author?.display_name}</span>
                        <span className="text-slate-500">@{post.author?.username}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 text-sm">{formatTimestamp(post.created_at)}</span>
                      </div>
                      {post.location && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {post.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-slate-900 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Media */}
                {post.media && post.media.length > 0 && (
                  <div className={`px-4 pb-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.media.map((media) => (
                      <div key={media.id} className="relative">
                        {media.media_type === 'video' ? (
                          <video
                            src={media.media_url}
                            poster={media.thumbnail_url}
                            controls
                            className="w-full rounded-lg"
                          />
                        ) : (
                          <img
                            src={media.media_url}
                            alt=""
                            className="w-full rounded-lg object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLike(post.id, post.user_has_liked || false)}
                      className="flex items-center gap-2 text-slate-600 hover:text-rose-500 transition-colors group"
                    >
                      <Heart
                        className={`w-5 h-5 ${post.user_has_liked ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                      <span className="text-sm">{post.like_count}</span>
                    </button>

                    <button
                      onClick={() => handleCommentToggle(post.id)}
                      className="flex items-center gap-2 text-slate-600 hover:text-cyan-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comment_count}</span>
                    </button>

                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-2 text-slate-600 hover:text-green-500 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">{post.share_count}</span>
                    </button>
                    
                    <button
                      onClick={() => handleInvite(post.id)}
                      className="flex items-center gap-2 text-slate-600 hover:text-purple-500 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="text-sm">Invite</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleBookmark(post.id, post.user_has_bookmarked || false)}
                    className="text-slate-600 hover:text-amber-500 transition-colors"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${post.user_has_bookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
                    />
                  </button>
                </div>

                {/* Comments Section */}
                {selectedPost === post.id && (
                  <div className="border-t bg-slate-50 p-4">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {comments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <img
                            src={comment.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author_id}`}
                            alt={comment.author?.display_name}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="bg-white rounded-lg p-3">
                              <div className="font-semibold text-sm mb-1">
                                {comment.author?.display_name}
                              </div>
                              <p className="text-sm text-slate-700">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                              <span>{formatTimestamp(comment.created_at)}</span>
                              <button className="hover:text-rose-500">Like · {comment.like_count}</button>
                              <button className="hover:text-cyan-500">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => loadFeed(true)}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}

export default EnhancedCommunityFeed;
