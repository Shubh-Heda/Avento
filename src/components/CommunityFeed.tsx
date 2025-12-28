import { ArrowLeft, Heart, TrendingUp, MapPin, Camera, Share2, Bookmark, Send, Image as ImageIcon, Loader, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { MemoryUpload } from './MemoryUpload';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Post {
  id: string;
  user_id: string;
  content: string;
  category: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  author?: {
    user_id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface Match {
  id: string;
  title: string;
  turfName: string;
  date: string;
  time: string;
  sport: string;
  status: 'upcoming' | 'completed';
  visibility: string;
  paymentOption: string;
  amount?: number;
  location?: string;
}

interface CommunityFeedProps {
  onNavigate: (page: 'dashboard' | 'profile' | 'community' | 'reflection' | 'finder' | 'create-match' | 'turf-detail' | 'chat' | 'availability' | 'map-view', turfId?: string, matchId?: string) => void;
  matches: Match[];
}

export function CommunityFeed({ onNavigate, matches }: CommunityFeedProps) {
  const [showMemoryUpload, setShowMemoryUpload] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadPosts();
    initializeUser();
  }, []);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || 'demo-user');
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try to load from database
        const { data, error } = await supabase
          .from('community_posts')
          .select('*')
          .eq('category', 'sports')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (data && data.length > 0 && !error) {
          setPosts(data as Post[]);
          setLoading(false);
          return;
        }
      }
      
      loadMockPosts();
    } catch (error) {
      console.error('Error loading posts:', error);
      loadMockPosts();
    } finally {
      setLoading(false);
    }
  };

  const loadMockPosts = () => {
    setPosts([
      {
        id: 'mock-1',
        user_id: 'user-1',
        content: 'Just finished an amazing match! 💫 Huge shoutout to everyone for bringing such great energy. This community makes every game special! 🙏⚽',
        category: 'sports',
        like_count: 24,
        comment_count: 8,
        share_count: 2,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        author: {
          user_id: 'user-1',
          display_name: 'Sarah Martinez',
          username: 'sarah_m',
          avatar_url: undefined
        }
      },
      {
        id: 'mock-2',
        user_id: 'user-2',
        content: 'Just got back from an incredible inter-city match! 🏏 Our team represented Ahmedabad and we won by 45 runs. The atmosphere was electric! 🎉',
        category: 'sports',
        like_count: 156,
        comment_count: 43,
        share_count: 12,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        author: {
          user_id: 'user-2',
          display_name: 'Jason Kumar',
          username: 'jason_k',
          avatar_url: undefined
        }
      },
      {
        id: 'mock-3',
        user_id: 'user-3',
        content: 'Recovery tips after intense matches 💪\n\n1. Hydrate within 30 minutes\n2. Light stretching\n3. Protein-rich snack\n4. Quality sleep - 7-8 hours',
        category: 'sports',
        like_count: 92,
        comment_count: 31,
        share_count: 18,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        author: {
          user_id: 'user-3',
          display_name: 'Coach Priya',
          username: 'coach_priya',
          avatar_url: undefined
        }
      }
    ]);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) {
      toast.error('Please write something or select media');
      return;
    }

    setIsPosting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let mediaUrls: string[] = [];
      
      // Upload media files if selected
      if (selectedFiles.length > 0 && user) {
        setUploadingMedia(true);
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('community-media')
            .upload(fileName, file);
          
          if (uploadData && !uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('community-media')
              .getPublicUrl(fileName);
            mediaUrls.push(publicUrl);
          }
        }
        setUploadingMedia(false);
      }
      
      if (user) {
        // Try to save to database
        const { data, error } = await supabase
          .from('community_posts')
          .insert({
            author_id: user.id,
            content: newPostContent,
            category: 'sports',
            media_urls: mediaUrls.length > 0 ? mediaUrls : null
          })
          .select()
          .single();
        
        if (data && !error) {
          const newPost: Post = {
            ...data,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
            author: {
              user_id: user.id,
              display_name: 'You',
              username: 'you',
              avatar_url: undefined
            }
          };
          setPosts(prev => [newPost, ...prev]);
          setNewPostContent('');
          setSelectedFiles([]);
          toast.success('Post shared! 🎉');
          return;
        }
      }
      
      // Fallback to mock
      const mockPost: Post = {
        id: `mock-${Date.now()}`,
        user_id: currentUserId,
        content: newPostContent,
        category: 'sports',
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          user_id: currentUserId,
          display_name: 'You',
          username: 'you',
          avatar_url: undefined
        }
      };
      setPosts(prev => [mockPost, ...prev]);
      setNewPostContent('');
      toast.success('Post shared! 🎉');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newIsLiked = !p.is_liked;
        return {
          ...p,
          is_liked: newIsLiked,
          like_count: newIsLiked ? p.like_count + 1 : p.like_count - 1
        };
      }
      return p;
    }));
  };

  const handleBookmark = async (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, is_bookmarked: !p.is_bookmarked } : p
    ));
    
    const post = posts.find(p => p.id === postId);
    toast.success(post?.is_bookmarked ? 'Removed' : 'Bookmarked! 🔖');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {showMemoryUpload && (
        <MemoryUpload
          onClose={() => setShowMemoryUpload(false)}
          onUploadComplete={() => {
            toast.success('Memory shared!');
            loadPosts();
          }}
        />
      )}
      
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => onNavigate('dashboard')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">Community</h1>
            </div>
            <Button onClick={() => setShowMemoryUpload(true)} className="bg-[#00a884] hover:bg-[#00a884]/90 text-white gap-2">
              <Camera className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => onNavigate('availability')} className="bg-white hover:bg-gray-50 text-gray-900 border shadow-sm h-auto py-4 justify-start">
            <TrendingUp className="w-5 h-5 mr-3 text-purple-600" />
            <div className="text-left">
              <div className="font-semibold">Who's Available?</div>
              <div className="text-xs text-gray-500">Find players now</div>
            </div>
          </Button>
          
          <Button onClick={() => onNavigate('map-view')} className="bg-white hover:bg-gray-50 text-gray-900 border shadow-sm h-auto py-4 justify-start">
            <MapPin className="w-5 h-5 mr-3 text-cyan-600" />
            <div className="text-left">
              <div className="font-semibold">Map View</div>
              <div className="text-xs text-gray-500">Matches near you</div>
            </div>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {currentUserId ? currentUserId.charAt(0).toUpperCase() : 'Y'}
            </div>
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your thoughts, match highlights, or training tips..."
                className="w-full border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#00a884] text-sm"
                rows={3}
                disabled={isPosting}
              />
              
              {/* Media Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="preview" 
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="media-upload"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                  <label htmlFor="media-upload" className="cursor-pointer text-gray-500 hover:text-[#00a884] p-1">
                    <ImageIcon className="w-5 h-5" />
                  </label>
                  <button onClick={() => setShowMemoryUpload(true)} className="text-gray-500 hover:text-[#00a884] p-1">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={(!newPostContent.trim() && selectedFiles.length === 0) || isPosting || uploadingMedia}
                  className="bg-[#00a884] hover:bg-[#00a884]/90 text-white gap-2"
                  size="sm"
                >
                  {(isPosting || uploadingMedia) ? <><Loader className="w-4 h-4 animate-spin" /> Posting...</> : <><Send className="w-4 h-4" /> Post</>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-[#00a884]" />
          </div>
        )}

        {!loading && posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm">
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {post.author?.display_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{post.author?.display_name || 'User'}</span>
                  {post.author?.username && <span className="text-sm text-gray-500">@{post.author.username}</span>}
                </div>
                <span className="text-xs text-gray-500">{formatTime(post.created_at)}</span>
              </div>
            </div>

            <div className="px-4 pb-3">
              <p className="text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
            </div>

            <div className="px-4 pb-3 flex items-center gap-6 text-sm border-t pt-3">
              <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 transition-colors ${post.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-red-500' : ''}`} />
                <span className="font-medium">{post.like_count}</span>
              </button>
              
              <button onClick={() => setShowComments(showComments === post.id ? null : post.id)} className="flex items-center gap-2 text-gray-500 hover:text-[#00a884] transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">{post.comment_count}</span>
              </button>
              
              <button onClick={() => { setPosts(prev => prev.map(p => p.id === post.id ? { ...p, share_count: p.share_count + 1 } : p)); toast.success('Shared! 🔗'); }} className="flex items-center gap-2 text-gray-500 hover:text-[#00a884] transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">{post.share_count}</span>
              </button>
              
              <button onClick={() => handleBookmark(post.id)} className={`ml-auto transition-colors ${post.is_bookmarked ? 'text-[#00a884]' : 'text-gray-500 hover:text-[#00a884]'}`}>
                <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-[#00a884]' : ''}`} />
              </button>
            </div>

            {/* Comments Section */}
            {showComments === post.id && (
              <div className="border-t bg-gray-50 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      J
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-2 text-sm">
                      <p className="font-semibold text-xs">John Doe</p>
                      <p className="text-gray-700">Great match! Let's play again soon 🔥</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      S
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-2 text-sm">
                      <p className="font-semibold text-xs">Sarah M</p>
                      <p className="text-gray-700">Amazing energy today! 💪</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 items-center pt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commentText.trim()) {
                        toast.success('Comment posted! 💬');
                        setCommentText('');
                        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p));
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    className="rounded-full bg-[#00a884] hover:bg-[#00a884]/90"
                    onClick={() => {
                      if (commentText.trim()) {
                        toast.success('Comment posted! 💬');
                        setCommentText('');
                        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p));
                      }
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏃‍♂️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
