import { ArrowLeft, Heart, MessageCircle, PartyPopper, Bell, Activity, Users, Music, Sparkles, Loader, Send, Camera, MapPin, Share2, Bookmark, X, ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LiveActivityFeed } from './LiveActivityFeed';
import { DiscordLikeRooms } from './DiscordLikeRooms';
import { ActivityHeatmap } from './ActivityHeatmap';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PartyCommunityFeedProps {
  onNavigate: (page: any) => void;
  onGetTickets?: (event: any) => void;
}

type CategoryType = 'party-notifications' | 'activity-heatmap' | 'vibe-rooms';

interface Category {
  id: CategoryType;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgGradient: string;
  accentColor: string;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  timeAgo: string;
  content: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export function PartyCommunityFeed({ onNavigate, onGetTickets }: PartyCommunityFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('party-notifications');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: 'DJ Krish',
      avatar: 'D',
      timeAgo: '3 hours ago',
      content: 'Epic Night Last Weekend! 🎧🔥\n\nThank you to everyone who came out! The energy was absolutely insane! Already planning the next one.',
      likes: 389,
      comments: 124,
      isLiked: false
    },
    {
      id: '2',
      author: 'Ananya Patel',
      avatar: 'A',
      timeAgo: '1 day ago',
      content: 'You\'re Invited: Bollywood Themed Birthday Bash! 🎂\n\nTurning 25 and celebrating Bollywood style! Dress up as your favorite character. RSVP by Monday! 💃🕺',
      likes: 78,
      comments: 34,
      isLiked: false
    }
  ]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const categories: Category[] = [
    {
      id: 'party-notifications',
      name: 'Party Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Live party updates & event announcements',
      color: 'from-pink-400 to-orange-500',
      bgGradient: 'from-pink-500/10 to-orange-500/10',
      accentColor: 'pink'
    },
    {
      id: 'activity-heatmap',
      name: 'Activity Heatmap',
      icon: <Activity className="w-5 h-5" />,
      description: 'Your party engagement stats',
      color: 'from-purple-400 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      accentColor: 'purple'
    },
    {
      id: 'vibe-rooms',
      name: 'Vibe Rooms',
      icon: <Users className="w-5 h-5" />,
      description: 'Live voice & text party rooms',
      color: 'from-cyan-400 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
      accentColor: 'cyan'
    }
  ];

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  const handlePost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0) {
      toast.error('Please write something or add media');
      return;
    }

    setIsPosting(true);
    setTimeout(() => {
      const newPost: Post = {
        id: Date.now().toString(),
        author: 'You',
        avatar: 'Y',
        timeAgo: 'Just now',
        content: newPostContent,
        likes: 0,
        comments: 0,
        isLiked: false
      };
      setPosts(prev => [newPost, ...prev]);
      setNewPostContent('');
      setSelectedFiles([]);
      setIsPosting(false);
      toast.success('Post shared! 🎉');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-40 backdrop-blur-sm border-b border-slate-800/50 sticky top-0 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('events-dashboard')}
              className="gap-2 hover:bg-slate-800 text-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <span>🎉</span>
                <span className="bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">Party Community</span>
              </h1>
              <p className="text-sm text-slate-400">Celebrate life together</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Selector */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-br ' + category.bgGradient + ' border-2 border-' + category.accentColor + '-500/50 shadow-lg'
                    : 'bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {selectedCategory === category.id && (
                  <motion.div
                    className={'absolute inset-0 bg-gradient-to-r ' + category.color + ' opacity-5'}
                    animate={{ opacity: [0.05, 0.1, 0.05] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={'p-2 rounded-lg bg-gradient-to-br ' + category.color + ' text-white shadow-lg'}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-100">{category.name}</h3>
                      <p className="text-xs text-slate-400">{category.description}</p>
                    </div>
                  </div>
                  
                  {selectedCategory === category.id && (
                    <motion.div
                      className={'h-1 rounded-full bg-gradient-to-r ' + category.color}
                      layoutId="active-indicator"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category Content */}
        <AnimatePresence mode="wait">
          {selectedCategory === 'party-notifications' && (
            <motion.div
              key="party-notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Party People', value: '3,142', color: 'pink' },
                  { label: 'Events This Week', value: '87', color: 'orange' },
                  { label: 'DJs & Hosts', value: '245', color: 'purple' },
                  { label: 'Venues', value: '42', color: 'cyan' }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-gradient-to-br from-slate-800/60 to-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center hover:border-slate-600/50 transition-colors"
                    whileHover={{ y: -2 }}
                  >
                    <div className={'text-' + stat.color + '-400 text-2xl font-bold mb-1'}>{stat.value}</div>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Live Activity */}
              <div className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-pink-500 to-orange-600 text-white">
                    <PartyPopper className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">Live Party Updates</h3>
                    <p className="text-sm text-slate-400">Real-time notifications from your community</p>
                  </div>
                </div>
                <LiveActivityFeed category="parties" />
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
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">Your Party Stats</h3>
                    <p className="text-sm text-slate-400">Track your party engagement</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Posts', value: '18', icon: <Sparkles className="w-5 h-5" /> },
                    { label: 'Interactions', value: '67', icon: <Heart className="w-5 h-5" /> },
                    { label: 'This Week', value: '12', icon: <Music className="w-5 h-5" /> },
                    { label: 'Streak', value: '8', icon: <PartyPopper className="w-5 h-5" /> }
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4 text-center hover:bg-slate-800/80 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-pink-400 flex justify-center mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                      <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                <ActivityHeatmap category="parties" />
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
              className="-mx-6 -mb-6 -mt-2"
            >
              <DiscordLikeRooms category="parties" onClose={() => setSelectedCategory('party-notifications')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post Creation - Only in party-notifications */}
        {selectedCategory === 'party-notifications' && (
          <motion.div
            className="bg-slate-800/40 border border-slate-700/50 rounded-xl shadow-lg backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-lg">
                Y
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your party moment... 🎉"
                  className="w-full border border-slate-700 bg-slate-800/50 hover:bg-slate-800 focus:bg-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400/50 transition-all text-sm"
                  rows={3}
                  disabled={isPosting}
                />
                
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
                      className="cursor-pointer text-slate-400 hover:text-pink-400 hover:bg-slate-700/50 p-2 rounded-lg transition-all"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </label>
                    <button 
                      className="text-slate-400 hover:text-pink-400 hover:bg-slate-700/50 p-2 rounded-lg transition-all"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <Button
                    onClick={handlePost}
                    disabled={(!newPostContent.trim() && selectedFiles.length === 0) || isPosting}
                    className="bg-gradient-to-r from-pink-500 to-orange-600 hover:from-pink-600 hover:to-orange-700 text-white gap-2 rounded-full px-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/25"
                    size="sm"
                  >
                    {isPosting ? <><Loader className="w-4 h-4 animate-spin" /> Posting...</> : <><Send className="w-4 h-4" /> Post</>}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Posts Feed - Only in party-notifications */}
        {selectedCategory === 'party-notifications' && (
          <div className="space-y-4">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              className="bg-slate-800/40 border border-slate-700/50 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden hover:border-slate-600/50 transition-colors group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="p-4 flex items-start gap-3">
                <motion.div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-lg" whileHover={{ scale: 1.1 }}>
                  {post.avatar}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{post.author}</span>
                  </div>
                  <span className="text-xs text-slate-500">{post.timeAgo}</span>
                </div>
              </div>

              <div className="px-4 pb-3">
                <p className="text-slate-200 whitespace-pre-wrap break-words">{post.content}</p>
              </div>

              <div className="px-4 pb-3 flex items-center gap-6 text-sm border-t border-slate-700/30 pt-3">
                <motion.button 
                  onClick={() => handleLike(post.id)} 
                  className={`flex items-center gap-2 transition-colors group/btn ${post.isLiked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}
                  whileHover={{ scale: 1.1 }}
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-400' : 'group-hover/btn:fill-red-400/50'}`} />
                  <span className="font-medium">{post.likes}</span>
                </motion.button>
                
                <motion.button 
                  className="flex items-center gap-2 text-slate-400 hover:text-pink-400 transition-colors group/btn"
                  whileHover={{ scale: 1.1 }}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.comments}</span>
                </motion.button>
                
                <motion.button 
                  className="flex items-center gap-2 text-slate-400 hover:text-orange-400 transition-colors group/btn"
                  whileHover={{ scale: 1.1 }}
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Share</span>
                </motion.button>
                
                <motion.button 
                  className="ml-auto transition-colors text-slate-400 hover:text-pink-400"
                  whileHover={{ scale: 1.1 }}
                >
                  <Bookmark className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}

          {posts.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold text-slate-200 mb-2">No posts yet</h3>
              <p className="text-slate-400">Be the first to share something amazing!</p>
            </motion.div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
