// ============================================
// Memory Service with Backend Integration
// Handles likes, comments, shares for memories
// ============================================

import { supabase } from '../lib/supabase';

export interface MemoryLike {
  id: string;
  memory_id: string;
  user_id: string;
  created_at: string;
}

export interface MemoryComment {
  id: string;
  memory_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface MemoryShare {
  id: string;
  memory_id: string;
  user_id: string;
  shared_to?: string; // platform or user
  created_at: string;
}

export interface MemoryStats {
  memory_id: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_liked?: boolean;
}

class MemoryService {
  // ==================== LIKES ====================
  
  async likeMemory(memoryId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('memory_likes')
        .insert({
          memory_id: memoryId,
          user_id: user.id
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error liking memory:', error);
      return false;
    }
  }

  async unlikeMemory(memoryId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('memory_likes')
        .delete()
        .eq('memory_id', memoryId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unliking memory:', error);
      return false;
    }
  }

  async getMemoryLikes(memoryId: string): Promise<MemoryLike[]> {
    try {
      const { data, error } = await supabase
        .from('memory_likes')
        .select('*')
        .eq('memory_id', memoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting memory likes:', error);
      return [];
    }
  }

  async checkIfLiked(memoryId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('memory_likes')
        .select('id')
        .eq('memory_id', memoryId)
        .eq('user_id', user.id)
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  }

  // ==================== COMMENTS ====================

  async addComment(memoryId: string, content: string): Promise<MemoryComment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('memory_comments')
        .insert({
          memory_id: memoryId,
          user_id: user.id,
          content: content
        })
        .select(`
          *,
          author:profiles!memory_comments_user_id_fkey (
            user_id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  async getComments(memoryId: string): Promise<MemoryComment[]> {
    try {
      const { data, error } = await supabase
        .from('memory_comments')
        .select(`
          *,
          author:profiles!memory_comments_user_id_fkey (
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('memory_id', memoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('memory_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // ==================== SHARES ====================

  async shareMemory(memoryId: string, sharedTo?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('memory_shares')
        .insert({
          memory_id: memoryId,
          user_id: user.id,
          shared_to: sharedTo
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sharing memory:', error);
      return false;
    }
  }

  async getMemoryShares(memoryId: string): Promise<MemoryShare[]> {
    try {
      const { data, error } = await supabase
        .from('memory_shares')
        .select('*')
        .eq('memory_id', memoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting memory shares:', error);
      return [];
    }
  }

  // ==================== STATS ====================

  async getMemoryStats(memoryId: string): Promise<MemoryStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get counts
      const [likes, comments, shares] = await Promise.all([
        this.getMemoryLikes(memoryId),
        this.getComments(memoryId),
        this.getMemoryShares(memoryId)
      ]);

      const isLiked = user ? await this.checkIfLiked(memoryId) : false;

      return {
        memory_id: memoryId,
        like_count: likes.length,
        comment_count: comments.length,
        share_count: shares.length,
        is_liked: isLiked
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return {
        memory_id: memoryId,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        is_liked: false
      };
    }
  }

  // ==================== BULK OPERATIONS ====================

  async getMultipleMemoryStats(memoryIds: string[]): Promise<Map<string, MemoryStats>> {
    const statsMap = new Map<string, MemoryStats>();
    
    try {
      // Get all stats in parallel
      const results = await Promise.all(
        memoryIds.map(id => this.getMemoryStats(id))
      );

      results.forEach(stats => {
        statsMap.set(stats.memory_id, stats);
      });
    } catch (error) {
      console.error('Error getting multiple memory stats:', error);
    }

    return statsMap;
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToMemoryUpdates(
    memoryId: string,
    onLike: (like: MemoryLike) => void,
    onComment: (comment: MemoryComment) => void
  ) {
    const likesSubscription = supabase
      .channel(`memory_likes_${memoryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memory_likes',
          filter: `memory_id=eq.${memoryId}`
        },
        (payload) => {
          onLike(payload.new as MemoryLike);
        }
      )
      .subscribe();

    const commentsSubscription = supabase
      .channel(`memory_comments_${memoryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'memory_comments',
          filter: `memory_id=eq.${memoryId}`
        },
        async (payload) => {
          // Fetch with author info
          const { data } = await supabase
            .from('memory_comments')
            .select(`
              *,
              author:profiles!memory_comments_user_id_fkey (
                user_id,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            onComment(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }
}

export const memoryService = new MemoryService();
export default memoryService;
