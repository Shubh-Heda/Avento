import { ArrowLeft, Heart, TrendingUp, MapPin, Camera, Share2, Bookmark, Send, Image as ImageIcon, Loader, MessageCircle, Radio, ChevronDown, Bell, Activity, Users, Zap, Flame, Wind, Volume2, Users2, Trophy, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { MemoryUpload } from './MemoryUpload';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { DiscordLikeRooms } from './DiscordLikeRooms';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';

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

type CategoryType = 'match-notifications' | 'activity-heatmap' | 'vibe-rooms';

interface Category {
  id: CategoryType;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgGradient: string;
  accentColor: string;
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
  const [postsPage, setPostsPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('match-notifications');
  const vibeRoomsRef = useRef<HTMLDivElement | null>(null);
  
  const POSTS_PER_PAGE = 3;

  const categories: Category[] = [
    {
      id: 'match-notifications',
      name: 'Match Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Live match updates & friend activity',
      color: 'from-cyan-400 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
      accentColor: 'cyan'
    },
    {
      id: 'activity-heatmap',
      name: 'Activity Heatmap',
      icon: <Activity className="w-5 h-5" />,
      description: 'Your community engagement stats',
      color: 'from-orange-400 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      accentColor: 'orange'
    },
    {
      id: 'vibe-rooms',
      name: 'Vibe Rooms',
      icon: <Users className="w-5 h-5" />,
      description: 'Live voice & text rooms',
      color: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      accentColor: 'purple'
    }
  ];

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
          setPosts((data as Post[]).slice(0, 3));
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
    ].slice(0, 3));
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
          setPosts(prev => [newPost, ...prev].slice(0, 3));
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
      setPosts(prev => [mockPost, ...prev].slice(0, 3));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Animated background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {showMemoryUpload && (
        <MemoryUpload
          onClose={() => setShowMemoryUpload(false)}
          onUploadComplete={() => {
            toast.success('Memory shared!');
            loadPosts();
          }}
        />
      )}
      
      {/* Dark Header */}
      <header className="relative z-40 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('dashboard')} 
                className="gap-2 hover:bg-slate-800 text-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Community Hub</h1>
                <p className="text-xs text-slate-400">Connect with your community</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowMemoryUpload(true)} 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2 rounded-full px-4 shadow-lg shadow-cyan-500/25"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-20 max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Category Selector - Amazing Design */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 group ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-br ${category.bgGradient} border-2 border-${category.accentColor}-500/50 shadow-lg shadow-${category.accentColor}-500/20`
                    : 'bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/60'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated gradient background for selected */}
                {selectedCategory === category.id && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-5`}
                    animate={{ opacity: [0.05, 0.1, 0.05] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-100">{category.name}</h3>
                      <p className="text-xs text-slate-400">{category.description}</p>
                    </div>
                  </div>
                  
                  {/* Active indicator */}
                  {selectedCategory === category.id && (
                    <motion.div
                      className={`h-1 rounded-full bg-gradient-to-r ${category.color}`}
                      layoutId="active-indicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category-specific content */}
        <AnimatePresence mode="wait">
          {selectedCategory === 'match-notifications' && (
            <motion.div
              key="match-notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">Live Match Updates</h3>
                    <p className="text-sm text-slate-400">Stay updated with your community's latest matches</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {matches.slice(0, 3).map((match, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4 hover:bg-slate-800/80 transition-colors cursor-pointer group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">{match.title}</h4>
                          <div className="flex gap-4 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {match.turfName}</span>
                            <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> {match.date} at {match.time}</span>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">{match.status}</Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selectedCategory === 'activity-heatmap' && (
            <motion.div
              key="activity-heatmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">Your Activity Stats</h3>
                    <p className="text-sm text-slate-400">Track your community engagement</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Posts', value: '12', icon: <Sparkles className="w-5 h-5" /> },
                    { label: 'Interactions', value: '48', icon: <Heart className="w-5 h-5" /> },
                    { label: 'This Week', value: '7', icon: <TrendingUp className="w-5 h-5" /> },
                    { label: 'Streak', value: '5', icon: <Flame className="w-5 h-5" /> }
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4 text-center hover:bg-slate-800/80 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-orange-400 flex justify-center mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                      <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Activity Heatmap Grid */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300">Contribution Calendar</h4>
                  <div className="bg-slate-800/30 rounded-lg p-4 flex flex-wrap gap-1">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`w-3 h-3 rounded-sm ${
                          Math.random() > 0.3
                            ? 'bg-gradient-to-br from-orange-500 to-red-600'
                            : 'bg-slate-700/40'
                        }`}
                        whileHover={{ scale: 1.5 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedCategory === 'vibe-rooms' && (
            <motion.div
              key="vibe-rooms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              ref={vibeRoomsRef}
              className="-mx-6 -mb-6 -mt-2"
            >
              <DiscordLikeRooms category="sports" onClose={() => setSelectedCategory('match-notifications')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post Creation Card */}
        {selectedCategory !== 'vibe-rooms' && (
          <motion.div
            className="bg-slate-800/40 border border-slate-700/50 rounded-xl shadow-lg backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-lg">
                {currentUserId ? currentUserId.charAt(0).toUpperCase() : 'Y'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={selectedCategory === 'match-notifications' 
                    ? 'Share match moments, celebrate wins... 🎉' 
                    : 'Share your activity insights... 📊'}
                  className="w-full border border-slate-700 bg-slate-800/50 hover:bg-slate-800 focus:bg-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all text-sm"
                  rows={3}
                  disabled={isPosting}
                />
                
                {/* Media Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {selectedFiles.map((file, idx) => (
                      <motion.div
                        key={idx}
                        className="relative group"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                        />
                        <button
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors shadow-lg"
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
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
                    <label 
                      htmlFor="media-upload" 
                      className="cursor-pointer text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 p-2 rounded-lg transition-all"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </label>
                    <button 
                      onClick={() => setShowMemoryUpload(true)} 
                      className="text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 p-2 rounded-lg transition-all"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <Button
                    onClick={handleCreatePost}
                    disabled={(!newPostContent.trim() && selectedFiles.length === 0) || isPosting || uploadingMedia}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2 rounded-full px-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
                    size="sm"
                  >
                    {(isPosting || uploadingMedia) ? <><Loader className="w-4 h-4 animate-spin" /> Posting...</> : <><Send className="w-4 h-4" /> Post</>}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <Loader className="w-8 h-8 text-cyan-500" />
              </motion.div>
            </div>
          )}

          {!loading && posts.slice(0, (postsPage + 1) * POSTS_PER_PAGE).map((post, idx) => (
            <motion.div
              key={post.id}
              className="bg-slate-800/40 border border-slate-700/50 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden hover:border-slate-600/50 transition-colors group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ borderColor: 'rgba(96, 165, 250, 0.5)' }}
            >
              <div className="p-4 flex items-start gap-3">
                <motion.div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-lg" whileHover={{ scale: 1.1 }}>
                  {post.author?.display_name?.charAt(0) || 'U'}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{post.author?.display_name || 'User'}</span>
                    {post.author?.username && <span className="text-sm text-slate-500">@{post.author.username}</span>}
                  </div>
                  <span className="text-xs text-slate-500">{formatTime(post.created_at)}</span>
                </div>
              </div>

              <div className="px-4 pb-3">
                <p className="text-slate-200 whitespace-pre-wrap break-words">{post.content}</p>
              </div>

              <div className="px-4 pb-3 flex items-center gap-6 text-sm border-t border-slate-700/30 pt-3">
                <motion.button 
                  onClick={() => handleLike(post.id)} 
                  className={`flex items-center gap-2 transition-colors group/btn ${post.is_liked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}
                  whileHover={{ scale: 1.1 }}
                >
                  <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-red-400' : 'group-hover/btn:fill-red-400/50'}`} />
                  <span className="font-medium">{post.like_count}</span>
                </motion.button>
                
                <motion.button 
                  onClick={() => setShowComments(showComments === post.id ? null : post.id)} 
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors group/btn"
                  whileHover={{ scale: 1.1 }}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.comment_count}</span>
                </motion.button>
                
                <motion.button 
                  onClick={() => { setPosts(prev => prev.map(p => p.id === post.id ? { ...p, share_count: p.share_count + 1 } : p)); toast.success('Shared! 🔗'); }} 
                  className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors group/btn"
                  whileHover={{ scale: 1.1 }}
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">{post.share_count}</span>
                </motion.button>
                
                <motion.button 
                  onClick={() => handleBookmark(post.id)} 
                  className={`ml-auto transition-colors ${post.is_bookmarked ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-400'}`}
                  whileHover={{ scale: 1.1 }}
                >
                  <Bookmark className={`w-5 h-5 ${post.is_bookmarked ? 'fill-cyan-400' : ''}`} />
                </motion.button>
              </div>

              {/* Comments Section */}
              {showComments === post.id && (
                <motion.div
                  className="border-t border-slate-700/30 bg-slate-800/20 p-4 space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="flex gap-2 items-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        J
                      </div>
                      <div className="flex-1 bg-slate-700/40 rounded-lg p-2 text-sm border border-slate-600/30">
                        <p className="font-semibold text-xs text-slate-300">John Doe</p>
                        <p className="text-slate-300">Great match! Let's play again soon 🔥</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        S
                      </div>
                      <div className="flex-1 bg-slate-700/40 rounded-lg p-2 text-sm border border-slate-600/30">
                        <p className="font-semibold text-xs text-slate-300">Sarah M</p>
                        <p className="text-slate-300">Amazing energy today! 💪</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-center pt-2 border-t border-slate-700/30">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 border border-slate-700 bg-slate-800/50 hover:bg-slate-800 focus:bg-slate-800 rounded-full px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && commentText.trim()) {
                          toast.success('Comment posted! 💬');
                          setCommentText('');
                          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p));
                        }
                      }}
                    />
                    <motion.button 
                      size="sm"
                      className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all shadow-lg shadow-cyan-500/25"
                      onClick={() => {
                        if (commentText.trim()) {
                          toast.success('Comment posted! 💬');
                          setCommentText('');
                          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comment_count: p.comment_count + 1 } : p));
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Load More Posts */}
          {!loading && (postsPage + 1) * POSTS_PER_PAGE < posts.length && (
            <motion.div
              className="text-center py-4"
              whileHover={{ scale: 1.02 }}
            >
              <Button
                onClick={() => setPostsPage(p => p + 1)}
                className="gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100"
              >
                <ChevronDown className="w-4 h-4" />
                Load More Posts
              </Button>
            </motion.div>
          )}

          {!loading && posts.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">No posts yet in this category</h3>
              <p className="text-slate-400 mb-4">Be the first to share something amazing!</p>
              <Button onClick={() => setShowMemoryUpload(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white gap-2 rounded-full px-4">
                <Camera className="w-4 h-4" />
                Share Memory
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
