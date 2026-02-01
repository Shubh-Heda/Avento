/**
 * Group Chat Service - Backend for Match & Event Chats
 * Handles automatic group chat creation, member management, and expense tracking
 */

import { supabase } from '../lib/supabase';

export interface GroupChat {
  id: string;
  match_id?: string;
  event_id?: string;
  chat_type: 'match' | 'event' | 'custom';
  name: string;
  description?: string;
  created_by: string;
  total_cost: number;
  currency: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupChatMember {
  id: string;
  group_chat_id: string;
  user_id: string;
  joined_at: string;
  share_amount: number; // Their share of total cost
  payment_status: 'pending' | 'paid' | 'settled';
  time_joined_minutes: number; // Minutes since match/event start
}

export interface GroupMessage {
  id: string;
  group_chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'expense' | 'payment' | 'system';
  media_url?: string;
  created_at: string;
  is_deleted: boolean;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface ExpenseItem {
  id: string;
  group_chat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[]; // User IDs
  created_at: string;
}

class GroupChatService {
  /**
   * Create automatic group chat when match is created
   */
  async createMatchGroupChat(
    matchId: string,
    matchName: string,
    totalCost: number,
    organizerId: string,
    organizerName: string,
    currency: string = 'INR'
  ): Promise<GroupChat> {
    try {
      const { data, error } = await supabase
        .from('group_chats')
        .insert({
          match_id: matchId,
          chat_type: 'match',
          name: `Match: ${matchName}`,
          description: `Group chat for ${matchName}`,
          created_by: organizerId,
          total_cost: totalCost,
          currency,
          member_count: 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Add organizer as first member
      await this.addGroupChatMember(
        data.id,
        organizerId,
        totalCost, // Organizer's initial share
        0 // Joined at start
      );

      return data;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }

  /**
   * Add member to group chat with share calculation
   */
  async addGroupChatMember(
    groupChatId: string,
    userId: string,
    totalCost: number,
    timeJoinedMinutes: number = 0
  ): Promise<GroupChatMember> {
    try {
      // Get current member count
      const { count } = await supabase
        .from('group_chat_members')
        .select('*', { count: 'exact' })
        .eq('group_chat_id', groupChatId);

      const memberCount = (count || 0) + 1;

      // Calculate share: split cost by number of members
      const shareAmount = totalCost / memberCount;

      const { data, error } = await supabase
        .from('group_chat_members')
        .insert({
          group_chat_id: groupChatId,
          user_id: userId,
          share_amount: shareAmount,
          payment_status: 'pending',
          time_joined_minutes: timeJoinedMinutes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update member count in group_chats
      await supabase
        .from('group_chats')
        .update({ member_count: memberCount })
        .eq('id', groupChatId);

      // Post system message about new member
      await this.postSystemMessage(
        groupChatId,
        `New member joined. Share updated to ${Math.round(shareAmount)} per person.`
      );

      return data;
    } catch (error) {
      console.error('Error adding group chat member:', error);
      throw error;
    }
  }

  /**
   * Send message in group chat
   */
  async sendGroupMessage(
    groupChatId: string,
    senderId: string,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string
  ): Promise<GroupMessage> {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_chat_id: groupChatId,
          sender_id: senderId,
          content,
          message_type: messageType,
          media_url: mediaUrl,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending group message:', error);
      throw error;
    }
  }

  /**
   * Post system message (auto-generated)
   */
  async postSystemMessage(groupChatId: string, content: string): Promise<GroupMessage> {
    return this.sendGroupMessage(
      groupChatId,
      'system', // System user
      content,
      'system'
    );
  }

  /**
   * Add expense and split among members
   */
  async addExpense(
    groupChatId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitBetween: string[]
  ): Promise<ExpenseItem> {
    try {
      const { data, error } = await supabase
        .from('expense_items')
        .insert({
          group_chat_id: groupChatId,
          description,
          amount,
          paid_by: paidBy,
          split_between: splitBetween,
        })
        .select()
        .single();

      if (error) throw error;

      // Post message about expense
      const amountPerPerson = amount / splitBetween.length;
      await this.sendGroupMessage(
        groupChatId,
        paidBy,
        `Added expense: ${description} - ₹${amount} (₹${Math.round(amountPerPerson)} per person)`,
        'expense'
      );

      return data;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  /**
   * Get all messages in group chat with pagination
   */
  async getGroupMessages(
    groupChatId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<GroupMessage[]> {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:sender_id(id, full_name, avatar_url)
        `)
        .eq('group_chat_id', groupChatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return (data || []).reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting group messages:', error);
      return [];
    }
  }

  /**
   * Get group chat details with member info
   */
  async getGroupChatDetails(groupChatId: string) {
    try {
      const { data, error } = await supabase
        .from('group_chats')
        .select(`
          *,
          members:group_chat_members(
            id,
            user_id,
            joined_at,
            share_amount,
            payment_status,
            time_joined_minutes,
            user:user_id(id, full_name, avatar_url)
          )
        `)
        .eq('id', groupChatId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting group chat details:', error);
      return null;
    }
  }

  /**
   * Get group chat by match ID
   */
  async getGroupChatByMatchId(matchId: string): Promise<GroupChat | null> {
    try {
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting group chat by match:', error);
      return null;
    }
  }

  /**
   * Calculate and update shares for all members
   */
  async recalculateShares(groupChatId: string): Promise<void> {
    try {
      // Get group chat
      const { data: groupChat, error: chatError } = await supabase
        .from('group_chats')
        .select('total_cost')
        .eq('id', groupChatId)
        .single();

      if (chatError) throw chatError;

      // Get all members
      const { data: members, error: membersError } = await supabase
        .from('group_chat_members')
        .select('id')
        .eq('group_chat_id', groupChatId);

      if (membersError) throw membersError;

      const memberCount = members?.length || 1;
      const newShare = groupChat.total_cost / memberCount;

      // Update all members with new share
      await supabase
        .from('group_chat_members')
        .update({ share_amount: newShare })
        .eq('group_chat_id', groupChatId);

      await this.postSystemMessage(
        groupChatId,
        `Share updated to ₹${Math.round(newShare)} per person (${memberCount} members)`
      );
    } catch (error) {
      console.error('Error recalculating shares:', error);
      throw error;
    }
  }

  /**
   * Mark member payment as done
   */
  async markPaymentDone(groupChatId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('group_chat_members')
        .update({ payment_status: 'paid' })
        .eq('group_chat_id', groupChatId)
        .eq('user_id', userId);

      // Get user info for message
      const { data: user } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      await this.postSystemMessage(
        groupChatId,
        `${user?.full_name || 'Member'} marked payment as done ✓`
      );
    } catch (error) {
      console.error('Error marking payment:', error);
      throw error;
    }
  }
}

export const groupChatService = new GroupChatService();
