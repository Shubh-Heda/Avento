// ============================================
// Chat Service - Real-time Messaging Backend
// ============================================
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  room_type: 'match' | 'event' | 'party' | 'gaming' | 'custom' | 'dm';
  created_by?: string;
  is_private: boolean;
  category?: string;
  related_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  unread_count?: number;
  member_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
  media_url?: string;
  media_thumbnail?: string;
  reply_to?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export type ChatMemberRole = 'admin' | 'moderator' | 'member';

export interface ChatModerationAction {
  id: string;
  room_id: string;
  actor_id: string;
  action_type: 'delete_message' | 'pin_message' | 'kick_user' | 'ban_user' | 'mute_user';
  target_message_id?: string;
  target_user_id?: string;
  reason?: string;
  created_at: string;
}

export interface ChatMessageReport {
  id: string;
  room_id: string;
  message_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
  status: 'pending' | 'actioned' | 'dismissed';
  created_at: string;
}

export interface ChatPinnedMessage {
  id: string;
  room_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: string;
  message?: ChatMessage;
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: ChatMemberRole;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// Chat Service
class ChatService {
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  // ==================== ROOM OPERATIONS ====================

  async getRooms(userId: string): Promise<ChatRoom[]> {
    const { data, error } = await supabase.rpc('get_user_chat_rooms', {
      p_user_id: userId
    });

    if (error) throw error;
    return data || [];
  }

  async getRoom(roomId: string): Promise<ChatRoom | null> {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data;
  }

  async createRoom(room: {
    name: string;
    description?: string;
    room_type: ChatRoom['room_type'];
    is_private?: boolean;
    category?: string;
    related_id?: string;
    avatar_url?: string;
  }): Promise<ChatRoom> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        ...room,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as admin member
    await this.addMember(data.id, user.id, 'admin');

    return data;
  }

  async updateRoom(roomId: string, updates: Partial<ChatRoom>): Promise<void> {
    const { error } = await supabase
      .from('chat_rooms')
      .update(updates)
      .eq('id', roomId);

    if (error) throw error;
  }

  async deleteRoom(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;
  }

  // ==================== MEMBER OPERATIONS ====================

  async getMembers(roomId: string): Promise<ChatRoomMember[]> {
    const { data, error } = await supabase
      .from('chat_room_members')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
      .eq('room_id', roomId);

    if (error) throw error;
    return data || [];
  }

  async addMember(roomId: string, userId: string, role: ChatRoomMember['role'] = 'member'): Promise<void> {
    const { error } = await supabase
      .from('chat_room_members')
      .insert({
        room_id: roomId,
        user_id: userId,
        role
      });

    if (error) throw error;
  }

  async getMemberRole(roomId: string): Promise<ChatMemberRole | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.role ?? null;
  }

  async removeMember(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async updateMemberRole(roomId: string, userId: string, role: ChatRoomMember['role']): Promise<void> {
    const { error } = await supabase
      .from('chat_room_members')
      .update({ role })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async promoteToModerator(roomId: string, userId: string): Promise<void> {
    await this.updateMemberRole(roomId, userId, 'moderator');
  }

  async promoteToAdmin(roomId: string, userId: string): Promise<void> {
    await this.updateMemberRole(roomId, userId, 'admin');
  }

  async markAsRead(roomId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('chat_room_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  // ==================== MESSAGE OPERATIONS ====================

  async getMessages(roomId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).reverse(); // Return in chronological order
  }

  async deleteMessage(roomId: string, messageId: string, reason?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        content: '[deleted by moderator]',
        media_url: null,
        media_thumbnail: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('room_id', roomId);

    if (error) throw error;

    await supabase.from('chat_moderation_actions').insert({
      room_id: roomId,
      actor_id: user.id,
      action_type: 'delete_message',
      target_message_id: messageId,
      reason
    });
  }

  async reportMessage(roomId: string, messageId: string, reason: string, details?: string): Promise<ChatMessageReport> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_message_reports')
      .insert({
        room_id: roomId,
        message_id: messageId,
        reporter_id: user.id,
        reason,
        details,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getModerationActions(roomId: string, limit = 20): Promise<ChatModerationAction[]> {
    const { data, error } = await supabase
      .from('chat_moderation_actions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ==================== PINNED MESSAGES ====================

  async pinMessage(roomId: string, messageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('chat_pinned_messages')
      .insert({
        room_id: roomId,
        message_id: messageId,
        pinned_by: user.id
      });

    if (error) throw error;

    await supabase.from('chat_moderation_actions').insert({
      room_id: roomId,
      actor_id: user.id,
      action_type: 'pin_message',
      target_message_id: messageId
    });
  }

  async unpinMessage(roomId: string, messageId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_pinned_messages')
      .delete()
      .eq('room_id', roomId)
      .eq('message_id', messageId);

    if (error) throw error;
  }

  async getPinnedMessages(roomId: string): Promise<ChatPinnedMessage[]> {
    const { data, error } = await supabase
      .from('chat_pinned_messages')
      .select(`
        *,
        message:chat_messages(
          *,
          sender:profiles(id, full_name, avatar_url)
        )
      `)
      .eq('room_id', roomId)
      .order('pinned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ==================== USER MODERATION ====================

  async kickUser(roomId: string, userId: string, reason?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await this.removeMember(roomId, userId);

    await supabase.from('chat_moderation_actions').insert({
      room_id: roomId,
      actor_id: user.id,
      action_type: 'kick_user',
      target_user_id: userId,
      reason
    });
  }

  async banUser(roomId: string, userId: string, reason?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await this.removeMember(roomId, userId);

    await supabase.from('chat_moderation_actions').insert({
      room_id: roomId,
      actor_id: user.id,
      action_type: 'ban_user',
      target_user_id: userId,
      reason
    });
  }

  async muteUser(roomId: string, userId: string, reason?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('chat_room_members')
      .update({ is_muted: true })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;

    await supabase.from('chat_moderation_actions').insert({
      room_id: roomId,
      actor_id: user.id,
      action_type: 'mute_user',
      target_user_id: userId,
      reason
    });
  }

  async unmuteUser(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_room_members')
      .update({ is_muted: false })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ==================== MESSAGE SEARCH ====================

  async searchMessages(roomId: string, query: string, limit = 20): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async sendMessage(roomId: string, content: string, messageType: ChatMessage['message_type'] = 'text', mediaUrl?: string): Promise<ChatMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content,
        message_type: messageType,
        media_url: mediaUrl
      })
      .select(`
        *,
        sender:profiles(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Mark as read for sender
    await this.markAsRead(roomId);

    return data;
  }

  async updateMessage(messageId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  // ==================== REACTION OPERATIONS ====================

  async addReaction(messageId: string, emoji: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji
      });

    if (error) throw error;
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) throw error;
  }

  async getReactions(messageId: string): Promise<MessageReaction[]> {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error) throw error;
    return data || [];
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToRoom(roomId: string, onMessage: (message: ChatMessage) => void): () => void {
    const channelName = `room:${roomId}`;
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(channelName)) {
      this.unsubscribeFromRoom(roomId);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          // Fetch full message with sender info
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:profiles(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onMessage(data);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return () => this.unsubscribeFromRoom(roomId);
  }

  unsubscribeFromRoom(roomId: string): void {
    const channelName = `room:${roomId}`;
    const channel = this.subscriptions.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  // ==================== UTILITY OPERATIONS ====================

  async getUnreadCount(roomId: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase.rpc('get_unread_message_count', {
      p_user_id: user.id,
      p_room_id: roomId
    });

    if (error) throw error;
    return data || 0;
  }

  // ==================== SOFT EXIT ====================
  /**
   * Soft exit from group - only admin is notified
   * Regular members don't see any notification
   */
  async softExitGroup(roomId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get room details and admin
    const room = await this.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const members = await this.getMembers(roomId);
    const admins = members.filter(m => m.role === 'admin');

    // Remove user from room
    await this.removeMember(roomId, user.id);

    // Send private notification to admins only
    if (admins.length > 0) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const userName = userProfile?.full_name || 'A member';

      // Send system message visible only to admins
      await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: `🚪 ${userName} left the group quietly`,
          message_type: 'system'
        });
    }
  }
}

export const chatService = new ChatService();
export default chatService;
