/**
 * Direct Message Service - 1-on-1 Chat Backend
 * Handles WhatsApp-like messaging between individuals
 */

import { supabase } from '../lib/supabase';

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file';
  media_url?: string;
  media_thumbnail?: string;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    is_online?: boolean;
  };
}

class DirectMessageService {
  /**
   * Get or create conversation between two users
   */
  async getOrCreateConversation(
    userId1: string,
    userId2: string
  ): Promise<Conversation> {
    try {
      // Ensure consistent ordering
      const [user1, user2] = userId1 < userId2 
        ? [userId1, userId2] 
        : [userId2, userId1];

      // Check if conversation exists
      let { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .single();

      // If not found, create new conversation
      if (error && error.code === 'PGRST116') {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            user1_id: user1,
            user2_id: user2,
          })
          .select()
          .single();

        if (createError) throw createError;
        conversation = newConv;
      } else if (error) {
        throw error;
      }

      return conversation;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send direct message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string,
    mediaThumbnail?: string
  ): Promise<DirectMessage> {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          message_type: messageType,
          media_url: mediaUrl,
          media_thumbnail: mediaThumbnail,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages in conversation with pagination
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<DirectMessage[]> {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:sender_id(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data || []).reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          other_user:user1_id(id, full_name, avatar_url)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform data to include other user info
      return (data || []).map((conv: any) => ({
        ...conv,
        other_user: conv.user1_id === userId 
          ? conv.other_user 
          : undefined, // Get from user2 instead
      }));
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await supabase
        .from('direct_messages')
        .update({ 
          is_deleted: true,
          content: '[Message deleted]'
        })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Search messages in conversation
   */
  async searchMessages(
    conversationId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<DirectMessage[]> {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:sender_id(id, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .ilike('content', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Check if users can message (no blocking, etc)
   */
  async canMessage(userId1: string, userId2: string): Promise<boolean> {
    try {
      // Check if either user blocked the other (you'd need a block_list table)
      // For now, assume all can message
      return true;
    } catch (error) {
      console.error('Error checking can message:', error);
      return false;
    }
  }
}

export const directMessageService = new DirectMessageService();
