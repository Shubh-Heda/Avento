/**
 * Group Chat Service - Backend for Match & Event Chats
 * Handles automatic group chat creation, member management, and expense tracking
 */

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
  members: string[];
  messages: GroupMessage[];
  created_at: string;
  updated_at: string;
}

export interface GroupChatMember {
  id: string;
  group_chat_id: string;
  user_id: string;
  joined_at: string;
  share_amount: number;
  payment_status: 'pending' | 'paid' | 'settled';
  time_joined_minutes: number;
}

export interface GroupMessage {
  id: string;
  group_chat_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: 'text' | 'image' | 'expense' | 'payment' | 'system';
  media_url?: string;
  created_at: string;
  is_deleted: boolean;
}

export interface ExpenseItem {
  id: string;
  group_chat_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  created_at: string;
}

const STORAGE_KEY = 'avento_group_chats';

class GroupChatService {
  /**
   * Get all group chats from localStorage
   */
  private getChatsFromStorage(): GroupChat[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading chats from storage:', error);
      return [];
    }
  }

  /**
   * Save chats to localStorage
   */
  private saveChatsToStorage(chats: GroupChat[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chats to storage:', error);
    }
  }

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
      const chats = this.getChatsFromStorage();
      
      const newChat: GroupChat = {
        id: `chat-${matchId}`,
        match_id: matchId,
        chat_type: 'match',
        name: matchName, // Use the exact name entered by user
        description: `Group chat for ${matchName}`,
        created_by: organizerId,
        total_cost: totalCost,
        currency,
        member_count: 1,
        members: [organizerId],
        messages: [
          {
            id: `msg-${Date.now()}`,
            group_chat_id: `chat-${matchId}`,
            sender_id: 'system',
            sender_name: 'System',
            content: `🎉 Welcome to ${matchName}!\n\n💰 Total Cost: ₹${totalCost}\n👥 Members: 1\n\nJoin and start chatting!`,
            message_type: 'system',
            created_at: new Date().toISOString(),
            is_deleted: false,
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      chats.push(newChat);
      this.saveChatsToStorage(chats);

      console.log('✅ Group chat created with name:', matchName);
      return newChat;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }

  /**
   * Get group chat by match ID
   */
  async getGroupChatByMatchId(matchId: string): Promise<GroupChat | null> {
    try {
      const chats = this.getChatsFromStorage();
      const chat = chats.find(c => c.match_id === matchId);
      return chat || null;
    } catch (error) {
      console.error('Error getting group chat:', error);
      return null;
    }
  }

  /**
   * Get group chat by ID
   */
  async getGroupChatById(chatId: string): Promise<GroupChat | null> {
    try {
      const chats = this.getChatsFromStorage();
      const chat = chats.find(c => c.id === chatId);
      return chat || null;
    } catch (error) {
      console.error('Error getting group chat:', error);
      return null;
    }
  }

  /**
   * Add member to group chat
   */
  async addGroupChatMember(
    groupChatId: string,
    userId: string,
    totalCost: number,
    timeJoinedMinutes: number = 0
  ): Promise<GroupChatMember> {
    try {
      const chats = this.getChatsFromStorage();
      const chat = chats.find(c => c.id === groupChatId);

      if (chat) {
        if (!chat.members.includes(userId)) {
          chat.members.push(userId);
          chat.member_count = chat.members.length;
          chat.updated_at = new Date().toISOString();
          this.saveChatsToStorage(chats);
        }
      }

      return {
        id: `member-${userId}-${groupChatId}`,
        group_chat_id: groupChatId,
        user_id: userId,
        joined_at: new Date().toISOString(),
        share_amount: totalCost,
        payment_status: 'pending',
        time_joined_minutes: timeJoinedMinutes,
      };
    } catch (error) {
      console.error('Error adding group chat member:', error);
      throw error;
    }
  }

  /**
   * Send message in group chat
   */
  async sendMessage(
    groupChatId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageType: 'text' | 'image' | 'expense' | 'payment' | 'system' = 'text'
  ): Promise<GroupMessage> {
    try {
      const chats = this.getChatsFromStorage();
      const chat = chats.find(c => c.id === groupChatId);

      const message: GroupMessage = {
        id: `msg-${Date.now()}`,
        group_chat_id: groupChatId,
        sender_id: senderId,
        sender_name: senderName,
        content,
        message_type: messageType,
        created_at: new Date().toISOString(),
        is_deleted: false,
      };

      if (chat) {
        chat.messages.push(message);
        chat.updated_at = new Date().toISOString();
        this.saveChatsToStorage(chats);
      }

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get all messages in a group chat
   */
  async getMessages(groupChatId: string): Promise<GroupMessage[]> {
    try {
      const chats = this.getChatsFromStorage();
      const chat = chats.find(c => c.id === groupChatId);
      return chat ? chat.messages : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Get all group chats for a user
   */
  async getUserGroupChats(userId: string): Promise<GroupChat[]> {
    try {
      const chats = this.getChatsFromStorage();
      return chats.filter(
        chat => chat.created_by === userId || chat.members.includes(userId)
      );
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  /**
   * Subscribe to messages in real-time
   */
  subscribeToMessages(
    groupChatId: string,
    callback: (messages: GroupMessage[]) => void
  ): () => void {
    // Simulate real-time updates with interval polling
    const interval = setInterval(async () => {
      const messages = await this.getMessages(groupChatId);
      callback(messages);
    }, 1000);

    return () => clearInterval(interval);
  }
}

export const groupChatService = new GroupChatService();
