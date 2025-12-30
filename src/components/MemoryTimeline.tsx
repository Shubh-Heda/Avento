import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Calendar, MapPin, Users, Heart, MessageCircle, Share2,
  Image, Clock, Sparkles, ChevronRight, Filter, Send, X
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { photosService, MemoryEntry } from '../services/photosService';
import memoryService, { MemoryStats, MemoryComment } from '../services/memoryService';

interface MemoryTimelineProps {
  category: 'sports' | 'events' | 'parties' | 'gaming';
  onNavigate: (page: string) => void;
}

export function MemoryTimeline({ category, onNavigate }: MemoryTimelineProps) {
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [memoryStats, setMemoryStats] = useState<Map<string, MemoryStats>>(new Map());
  const [comments, setComments] = useState<MemoryComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const memories = photosService.getMemoriesByCategory(category);
  const sortedMemories = sortBy === 'recent' 
    ? memories 
    : [...memories].reverse();

  // Load stats for all memories
  useEffect(() => {
    const loadStats = async () => {
      const memoryIds = memories.map(m => m.id);
      const stats = await memoryService.getMultipleMemoryStats(memoryIds);
      setMemoryStats(stats);
    };
    if (memories.length > 0) {
      loadStats();
    }
  }, [memories]);

  // Load comments when memory is selected
  useEffect(() => {
    if (selectedMemory) {
      loadComments();
      // Subscribe to real-time updates
      const unsubscribe = memoryService.subscribeToMemoryUpdates(
        selectedMemory.id,
        () => loadStats(),
        (newComment) => setComments(prev => [newComment, ...prev])
      );
      return () => unsubscribe();
    }
  }, [selectedMemory]);

  const loadStats = async () => {
    if (!selectedMemory) return;
    const stats = await memoryService.getMemoryStats(selectedMemory.id);
    setMemoryStats(prev => new Map(prev).set(selectedMemory.id, stats));
  };

  const loadComments = async () => {
    if (!selectedMemory) return;
    setLoadingComments(true);
    const memoryComments = await memoryService.getComments(selectedMemory.id);
    setComments(memoryComments);
    setLoadingComments(false);
  };

  const handleLike = async (memoryId: string) => {
    const stats = memoryStats.get(memoryId);
    const isLiked = stats?.is_liked;

    if (isLiked) {
      await memoryService.unlikeMemory(memoryId);
      toast.success('Removed like');
    } else {
      await memoryService.likeMemory(memoryId);
      toast.success('Liked! ❤️');
    }
    
    // Refresh stats
    const newStats = await memoryService.getMemoryStats(memoryId);
    setMemoryStats(prev => new Map(prev).set(memoryId, newStats));
  };

  const handleComment = async () => {
    if (!selectedMemory || !commentInput.trim()) return;
    
    const comment = await memoryService.addComment(selectedMemory.id, commentInput);
    if (comment) {
      setComments(prev => [comment, ...prev]);
      setCommentInput('');
      toast.success('Comment added! 💬');
      await loadStats();
    }
  };

  const handleShare = async (memoryId: string) => {
    await memoryService.shareMemory(memoryId, 'community');
    toast.success('Memory shared! 🎉');
    const newStats = await memoryService.getMemoryStats(memoryId);
    setMemoryStats(prev => new Map(prev).set(memoryId, newStats));
  };

  const moodEmojis: Record<string, string> = {
    '🥳 Excited': '🥳',
    '😭 Emotional': '😭',
    '😊 Happy': '😊',
    '🤩 Amazed': '🤩',
    '💪 Proud': '💪',
    '🔥 Energized': '🔥'
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'sports': return '⚽';
      case 'events': return '🎵';
      case 'parties': return '🎉';
      case 'gaming': return '🎮';
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'sports': return 'from-emerald-500 to-cyan-500';
      case 'events': return 'from-purple-500 to-pink-500';
      case 'parties': return 'from-pink-500 to-red-500';
      case 'gaming': return 'from-indigo-500 to-purple-500';
    }
  };

  const getCategoryName = () => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => {
                const dashboardMap: Record<string, string> = {
                  sports: 'dashboard',
                  events: 'events-dashboard',
                  parties: 'party-dashboard',
                  gaming: 'gaming-hub'
                };
                onNavigate(dashboardMap[category]);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getCategoryIcon()}</span>
                <h1 className="text-2xl font-bold text-slate-900">Memory Timeline</h1>
              </div>
              <p className="text-sm text-slate-600">Relive your best {getCategoryName()} moments</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
              className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 hover:border-slate-400 transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {memories.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No memories yet</p>
            <p className="text-slate-500 text-sm mt-2">Upload photos and create memories from your {getCategoryName()} moments!</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200" />

            {/* Timeline items */}
            <div className="space-y-8">
              {sortedMemories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="ml-24 relative"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-20 top-6 w-8 h-8 bg-white border-4 border-slate-300 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full" />
                  </div>

                  {/* Memory card */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => setSelectedMemory(memory)}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-200 cursor-pointer group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-slate-900">{memory.title}</h3>
                          <span className="text-2xl">{moodEmojis[memory.mood] || memory.mood.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(memory.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{memory.location}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                        {memory.category}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-slate-700 mb-4 line-clamp-3">{memory.description}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Image className="w-4 h-4 text-slate-600" />
                          <span className="text-xs text-slate-600">Photos</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{memory.photos.length}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-slate-600" />
                          <span className="text-xs text-slate-600">People</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{memory.participants.length}</p>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 mb-2">People in this memory</p>
                      <div className="flex flex-wrap gap-2">
                        {memory.participants.map((participant, idx) => (
                          <Badge key={idx} className="bg-slate-100 text-slate-700 border-slate-300">
                            {participant}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* View button */}
                    <Button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white group-hover:shadow-lg transition-all">
                      View Full Memory
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMemory(null)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{moodEmojis[selectedMemory.mood] || selectedMemory.mood.split(' ')[0]}</span>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMemory.title}</h2>
                    <p className="text-sm text-white/80">{new Date(selectedMemory.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Location and Details */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <span className="text-slate-700">{selectedMemory.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <span className="text-slate-700">{new Date(selectedMemory.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-500" />
                      <span className="text-slate-700">{selectedMemory.participants.length} people attended</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">What Happened</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedMemory.description}</p>
                </div>

                {/* Participants */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Memorable People</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMemory.participants.map((participant, idx) => (
                      <Badge key={idx} className="bg-slate-100 text-slate-700 border-slate-300 text-base py-2 px-3">
                        {participant}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Photos Grid */}
                {selectedMemory.photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Photos ({selectedMemory.photos.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedMemory.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center text-5xl hover:scale-105 transition-transform cursor-pointer"
                        >
                          {photo.url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Comments ({memoryStats.get(selectedMemory.id)?.comment_count || 0})</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {loadingComments ? (
                      <p className="text-sm text-slate-500 text-center py-4">Loading comments...</p>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {comment.author?.display_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 bg-slate-50 rounded-lg p-3">
                            <p className="font-semibold text-sm text-slate-900 mb-1">
                              {comment.author?.display_name || 'User'}
                            </p>
                            <p className="text-sm text-slate-700">{comment.content}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(comment.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                      placeholder="Write a comment..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    <Button
                      onClick={handleComment}
                      disabled={!commentInput.trim()}
                      className="bg-slate-600 hover:bg-slate-700 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => handleLike(selectedMemory.id)}
                    className={`flex-1 flex items-center justify-center gap-2 transition-all ${
                      memoryStats.get(selectedMemory.id)?.is_liked
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        memoryStats.get(selectedMemory.id)?.is_liked ? 'fill-rose-500' : ''
                      }`}
                    />
                    <span>Like ({memoryStats.get(selectedMemory.id)?.like_count || 0})</span>
                  </Button>
                  <Button
                    onClick={() => handleShare(selectedMemory.id)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share ({memoryStats.get(selectedMemory.id)?.share_count || 0})</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
