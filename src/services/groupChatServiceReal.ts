/**
 * Real Group Chat Service - Using Supabase
 * Full implementation for real-time group messaging, invites, and member management
 */

import { supabase, supabaseEnabled } from '../lib/supabaseClient';

export interface RealGroupChat {
  id: string;
  match_id?: string;
  event_id?: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  group_chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  message_type: 'text' | 'system' | 'invite' | 'payment';
  created_at: string;
  updated_at: string;
}

export interface ChatMember {
  id: string;
  group_chat_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  role: 'admin' | 'member';
  joined_at: string;
  is_active: boolean;
}

export interface ChatInvite {
  id: string;
  group_chat_id: string;
  invited_by: string;
  invited_email: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  expires_at: string;
}

export class RealGroupChatService {
  /**
   * Create a new group chat for a match
   */
  async createGroupChat(
    matchId: string,
    chatName: string,
    description: string,
    createdById: string,
    createdByName: string,
    createdByEmail: string
  ): Promise<RealGroupChat> {
    try {
      if (!supabaseEnabled || !supabase) {
        throw new Error('Supabase not configured');
      }

      const { data: chat, error } = await supabase
        .from('group_chats')
        .insert([
          {
            match_id: matchId,
            name: chatName,
            description,
            created_by: createdById,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await this.addMember(chat.id, createdById, 'admin', createdByName, createdByEmail);

      console.log('✅ Group chat created:', chatName);
      return chat;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }

  /**
   * Get group chat by ID
   */
  async getGroupChat(chatId: string): Promise<RealGroupChat | null> {
    try {
      if (!supabaseEnabled || !supabase) return null;

      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting group chat:', error);
      return null;
    }
  }

  /**
   * Get group chat by match ID
   */
  async getGroupChatByMatchId(matchId: string): Promise<RealGroupChat | null> {
    try {
      if (!supabaseEnabled || !supabase) return null;

      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting group chat by match ID:', error);
      return null;
    }
  }

  /**
   * Add member to group chat
   */
  async addMember(
    groupChatId: string,
    userId: string,
    role: 'admin' | 'member' = 'member',
    userName: string = 'User',
    userEmail: string = 'user@example.com'
  ): Promise<ChatMember> {
    try {
      if (!supabaseEnabled || !supabase) {
        throw new Error('Supabase not configured');
      }

      // Check if member already exists
      const { data: existing } = await supabase
        .from('chat_members')
        .select('*')
        .eq('group_chat_id', groupChatId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update if already a member
        const { data: updated, error } = await supabase
          .from('chat_members')
          .update({ is_active: true })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      }

      // Add new member
      const { data: member, error } = await supabase
        .from('chat_members')
        .insert([
          {
            group_chat_id: groupChatId,
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            role,
            joined_at: new Date().toISOString(),
            is_active: true,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Send system message
      await this.sendMessage(
        groupChatId,
        'system',
        'System',
        `${userName} joined the chat 👋`,
        'system'
      );

      return member;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  /**
   * Remove member from group chat
   */
  async removeMember(groupChatId: string, userId: string): Promise<void> {
    try {
      if (!supabaseEnabled || !supabase) {
        throw new Error('Supabase not configured');
      }

      const { error: memberError } = await supabase
        .from('chat_members')
        .update({ is_active: false })
        .eq('group_chat_id', groupChatId)
        .eq('user_id', userId);

      if (memberError) throw memberError;

      // Get member name for system message
      const { data: member } = await supabase
        .from('chat_members')
        .select('user_name')
        .eq('group_chat_id', groupChatId)
        .eq('user_id', userId)
        .single();

      if (member) {
        await this.sendMessage(
          groupChatId,
          'system',
          'System',
          `${member.user_name} left the chat`,
          'system'
        );
      }
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  /**
   * Send message to group chat
   */
  async sendMessage(
    groupChatId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageType: 'text' | 'system' | 'invite' | 'payment' = 'text',
    senderAvatar?: string
  ): Promise<ChatMessage> {
    try {
      if (!supabaseEnabled || !supabase) {
        throw new Error('Supabase not configured');
      }

      const now = new Date().toISOString();
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            group_chat_id: groupChatId,
            sender_id: senderId,
            sender_name: senderName,
            sender_avatar: senderAvatar,
            content,
            message_type: messageType,
            created_at: now,
            updated_at: now,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update group chat updated_at
      await supabase
        .from('group_chats')
        .update({ updated_at: now })
        .eq('id', groupChatId);

      console.log('✅ Message sent');
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get all messages in a group chat
   */
  async getMessages(groupChatId: string, limit: number = 100): Promise<ChatMessage[]> {
    try {
      if (!supabaseEnabled || !supabase) return [];

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_chat_id', groupChatId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return messages || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Get all members of a group chat
   */
  async getMembers(groupChatId: string): Promise<ChatMember[]> {
    try {
      if (!supabaseEnabled || !supabase) return [];

      const { data: members, error } = await supabase
        .from('chat_members')
        .select('*')
        .eq('group_chat_id', groupChatId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return members || [];
    } catch (error) {
      console.error('Error getting members:', error);
      return [];
    }
  }

  /**
   * Send invite to a user
   */
  async sendInvite(
    groupChatId: string,
    invitedEmail: string,
    invitedById: string
  ): Promise<ChatInvite> {
    try {
      if (!supabaseEnabled || !supabase) {
        throw new Error('Supabase not configured');
      }

      const token = Math.random().toString(36).substr(2, 32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: invite, error } = await supabase
        .from('chat_invites')
        .insert([
          {
            group_chat_id: groupChatId,
            invited_by: invitedById,
            invited_email: invitedEmail,
            token,
            status: 'pending',
            created_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Send system message about invite
      await this.sendMessage(
        groupChatId,
        'system',
        'System',
        `Invite sent to ${invitedEmail} 📧`,
        'invite'
      );

      console.log('✅ Invite sent to:', invitedEmail);
      return invite;
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  }

  /**
   * Accept invite and join group chat
   */
  async acceptInvite(
    inviteToken: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<{ success: boolean; groupChatId?: string; error?: string }> {
    try {
      if (!supabaseEnabled || !supabase) {
        throw new Error('Supabase not configured');
      }

      // Get invite
      const { data: invite, error: inviteError } = await supabase
        .from('chat_invites')
        .select('*')
        .eq('token', inviteToken)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        return { success: false, error: 'Invalid or expired invite' };
      }

      // Check if invite is expired
      if (new Date(invite.expires_at) < new Date()) {
        return { success: false, error: 'Invite has expired' };
      }

      // Add user as member
      await this.addMember(
        invite.group_chat_id,
        userId,
        'member',
        userName,
        userEmail
      );

      // Mark invite as accepted
      await supabase
        .from('chat_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      return { success: true, groupChatId: invite.group_chat_id };
    } catch (error) {
      console.error('Error accepting invite:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get pending invites for a group chat
   */
  async getPendingInvites(groupChatId: string): Promise<ChatInvite[]> {
    try {
      if (!supabaseEnabled || !supabase) return [];

      const { data: invites, error } = await supabase
        .from('chat_invites')
        .select('*')
        .eq('group_chat_id', groupChatId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return invites || [];
    } catch (error) {
      console.error('Error getting pending invites:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time messages
   */
  subscribeToMessages(
    groupChatId: string,
    callback: (messages: ChatMessage[]) => void
  ): (() => void) {
    if (!supabaseEnabled || !supabase) {
      return () => {};
    }

    const subscription = supabase
      .from(`chat_messages:group_chat_id=eq.${groupChatId}`)
      .on('*', (payload) => {
        // Fetch fresh messages on any change
        this.getMessages(groupChatId).then(callback);
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }

  /**
   * Subscribe to real-time members
   */
  subscribeToMembers(
    groupChatId: string,
    callback: (members: ChatMember[]) => void
  ): (() => void) {
    if (!supabaseEnabled || !supabase) {
      return () => {};
    }

    const subscription = supabase
      .from(`chat_members:group_chat_id=eq.${groupChatId}`)
      .on('*', (payload) => {
        // Fetch fresh members on any change
        this.getMembers(groupChatId).then(callback);
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }

  /**
   * Get user's group chats
   */
  async getUserGroupChats(userId: string): Promise<RealGroupChat[]> {
    try {
      if (!supabaseEnabled || !supabase) return [];

      const { data: members, error } = await supabase
        .from('chat_members')
        .select('group_chat_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      if (!members || members.length === 0) return [];

      const chatIds = members.map(m => m.group_chat_id);
      const { data: chats, error: chatsError } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;
      return chats || [];
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }
}

export const realGroupChatService = new RealGroupChatService();
