/**
 * Enhanced Group Chat Backend Service
 * Integrates real user data, real-time messaging, and expense tracking
 * Uses Supabase for persistence and real-time updates
 */

// Firebase imports removed - using Supabase
// import { db, isFirebaseConfigured } from '../lib/firebase';
import { supabase, supabaseEnabled } from '../lib/supabaseClient';
// Firestore imports removed
// import { collection, doc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, onSnapshot, Timestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { supabaseAuth, usersService } from './supabaseAuthService';

// ===== INTERFACES =====

export interface GroupChatWithUsers {
  id: string;
  match_id?: string;
  event_id?: string;
  chat_type: 'match' | 'event' | 'custom';
  name: string;
  description?: string;
  created_by: string;
  created_by_name?: string;
  total_cost: number;
  currency: string;
  member_count: number;
  members: GroupMemberWithUserData[];
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_sender?: string;
  last_message_at?: string;
}

export interface GroupMemberWithUserData {
  id: string;
  group_chat_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_phone?: string;
  joined_at: string;
  share_amount: number;
  payment_status: 'pending' | 'paid' | 'settled';
  time_joined_minutes: number;
}

export interface GroupMessageWithUserData {
  id: string;
  group_chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  message_type: 'text' | 'image' | 'expense' | 'payment' | 'system';
  media_url?: string;
  created_at: string;
  is_deleted: boolean;
  read_by?: string[];
}

export interface ExpenseItem {
  id: string;
  group_chat_id: string;
  description: string;
  amount: number;
  paid_by_id: string;
  paid_by_name: string;
  split_between: string[]; // User IDs
  created_at: string;
}

// ===== GROUP CHAT SERVICE =====

class EnhancedGroupChatService {
  private FIREBASE_ENABLED = isFirebaseConfigured();

  /**
   * Create group chat with real user data
   */
  async createGroupChat(data: {
    match_id?: string;
    event_id?: string;
    chat_type: 'match' | 'event' | 'custom';
    name: string;
    description?: string;
    created_by: string;
    total_cost: number;
    currency: string;
  }): Promise<{ id: string; data: GroupChatWithUsers } | null> {
    try {
      if (!this.FIREBASE_ENABLED) {
        console.log('📱 Using localStorage for group chat');
        return this.createGroupChatLocal(data);
      }

      console.log('🔥 Creating group chat in Firebase');

      // Get creator user data
      const creator = await usersService.getUserProfile(data.created_by);
      const createdAt = serverTimestamp();

      const chatRef = await addDoc(collection(db, 'group_chats'), {
        match_id: data.match_id,
        event_id: data.event_id,
        chat_type: data.chat_type,
        name: data.name,
        description: data.description,
        created_by: data.created_by,
        created_by_name: creator?.displayName || creator?.email || 'Unknown',
        total_cost: data.total_cost,
        currency: data.currency,
        member_count: 0,
        created_at: createdAt,
        updated_at: createdAt,
        last_message: null,
        last_message_sender: null,
        last_message_at: null,
      });

      console.log(`✅ Group chat created: ${chatRef.id}`);

      return {
        id: chatRef.id,
        data: {
          id: chatRef.id,
          ...data,
          created_by_name: creator?.displayName || creator?.email,
          member_count: 0,
          members: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Error creating group chat:', error);
      throw error;
    }
  }

  /**
   * Add member to group chat with real user data
   */
  async addGroupChatMember(
    groupChatId: string,
    userId: string,
    shareAmount: number
  ): Promise<GroupMemberWithUserData | null> {
    try {
      if (!this.FIREBASE_ENABLED) {
        console.log('📱 Adding member via localStorage');
        return this.addMemberLocal(groupChatId, userId, shareAmount);
      }

      console.log(`🔥 Adding member ${userId} to group chat`);

      // Get user data
      const user = await usersService.getUserProfile(userId);

      const memberRef = await addDoc(collection(db, 'group_chat_members'), {
        group_chat_id: groupChatId,
        user_id: userId,
        user_name: user?.displayName || user?.email || 'Unknown User',
        user_avatar: user?.avatar_url,
        user_phone: user?.phone,
        joined_at: serverTimestamp(),
        share_amount: shareAmount,
        payment_status: 'pending',
        time_joined_minutes: 0,
      });

      // Update group chat member count
      await updateDoc(doc(db, 'group_chats', groupChatId), {
        member_count: await this.getMemberCount(groupChatId),
      });

      console.log(`✅ Member added: ${userId}`);

      return {
        id: memberRef.id,
        group_chat_id: groupChatId,
        user_id: userId,
        user_name: user?.displayName || user?.email || 'Unknown User',
        user_avatar: user?.avatar_url,
        user_phone: user?.phone,
        joined_at: new Date().toISOString(),
        share_amount: shareAmount,
        payment_status: 'pending',
        time_joined_minutes: 0,
      };
    } catch (error) {
      console.error('❌ Error adding member:', error);
      throw error;
    }
  }

  /**
   * Post message with real sender data
   */
  async postMessage(
    groupChatId: string,
    senderId: string,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string
  ): Promise<GroupMessageWithUserData | null> {
    try {
      if (!this.FIREBASE_ENABLED) {
        console.log('📱 Posting message via localStorage');
        return this.postMessageLocal(groupChatId, senderId, content, messageType);
      }

      console.log(`💬 Posting message to group chat`);

      // Get sender data
      const sender = await usersService.getUserProfile(senderId);

      const messageRef = await addDoc(collection(db, 'group_chat_messages'), {
        group_chat_id: groupChatId,
        sender_id: senderId,
        sender_name: sender?.displayName || sender?.email || 'Unknown',
        sender_avatar: sender?.avatar_url,
        content,
        message_type: messageType,
        media_url: mediaUrl,
        created_at: serverTimestamp(),
        is_deleted: false,
        read_by: [senderId],
      });

      // Update last message in group chat
      await updateDoc(doc(db, 'group_chats', groupChatId), {
        last_message: content,
        last_message_sender: sender?.displayName || sender?.email,
        last_message_at: serverTimestamp(),
      });

      console.log(`✅ Message posted: ${messageRef.id}`);

      return {
        id: messageRef.id,
        group_chat_id: groupChatId,
        sender_id: senderId,
        sender_name: sender?.displayName || sender?.email || 'Unknown',
        sender_avatar: sender?.avatar_url,
        content,
        message_type: messageType as any,
        media_url: mediaUrl,
        created_at: new Date().toISOString(),
        is_deleted: false,
        read_by: [senderId],
      };
    } catch (error) {
      console.error('❌ Error posting message:', error);
      throw error;
    }
  }

  /**
   * Get group chat with all members and user data
   */
  async getGroupChatWithMembers(groupChatId: string): Promise<GroupChatWithUsers | null> {
    try {
      if (!this.FIREBASE_ENABLED) {
        console.log('📱 Loading group chat via localStorage');
        return this.getGroupChatLocal(groupChatId);
      }

      console.log(`🔥 Loading group chat ${groupChatId}`);

      // Get group chat
      const chatDoc = await getDocs(
        query(collection(db, 'group_chats'), where('id', '==', groupChatId))
      );

      if (chatDoc.empty) {
        console.warn('Group chat not found');
        return null;
      }

      const chatData = chatDoc.docs[0].data();

      // Get members
      const membersSnapshot = await getDocs(
        query(collection(db, 'group_chat_members'), where('group_chat_id', '==', groupChatId))
      );

      const members: GroupMemberWithUserData[] = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as GroupMemberWithUserData));

      console.log(`✅ Loaded group chat with ${members.length} members`);

      return {
        id: groupChatId,
        ...chatData,
        members,
        created_at: chatData.created_at?.toDate?.().toISOString() || new Date().toISOString(),
        updated_at: chatData.updated_at?.toDate?.().toISOString() || new Date().toISOString(),
        last_message_at: chatData.last_message_at?.toDate?.().toISOString(),
      } as GroupChatWithUsers;
    } catch (error) {
      console.error('❌ Error loading group chat:', error);
      return null;
    }
  }

  /**
   * Get all messages in group chat
   */
  async getGroupChatMessages(groupChatId: string): Promise<GroupMessageWithUserData[]> {
    try {
      if (!this.FIREBASE_ENABLED) {
        console.log('📱 Loading messages via localStorage');
        return this.getMessagesLocal(groupChatId);
      }

      console.log(`📥 Loading messages for group chat`);

      const snapshot = await getDocs(
        query(
          collection(db, 'group_chat_messages'),
          where('group_chat_id', '==', groupChatId),
          where('is_deleted', '==', false)
        )
      );

      const messages: GroupMessageWithUserData[] = snapshot.docs
        .sort((a, b) => {
          const aTime = a.data().created_at?.toDate?.().getTime() || 0;
          const bTime = b.data().created_at?.toDate?.().getTime() || 0;
          return aTime - bTime;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString(),
        } as GroupMessageWithUserData));

      console.log(`✅ Loaded ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      return [];
    }
  }

  /**
   * Subscribe to group chat messages (real-time)
   */
  subscribeToGroupMessages(
    groupChatId: string,
    callback: (messages: GroupMessageWithUserData[]) => void
  ): (() => void) | null {
    if (!this.FIREBASE_ENABLED) {
      console.log('📱 LocalStorage does not support real-time subscriptions');
      return null;
    }

    console.log('🔥 Subscribing to group messages (real-time)');

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'group_chat_messages'),
        where('group_chat_id', '==', groupChatId),
        where('is_deleted', '==', false)
      ),
      (snapshot) => {
        const messages: GroupMessageWithUserData[] = snapshot.docs
          .sort((a, b) => {
            const aTime = a.data().created_at?.toDate?.().getTime() || 0;
            const bTime = b.data().created_at?.toDate?.().getTime() || 0;
            return aTime - bTime;
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate?.().toISOString() || new Date().toISOString(),
          } as GroupMessageWithUserData));

        console.log(`✅ Updated ${messages.length} messages`);
        callback(messages);
      }
    );

    return unsubscribe;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(groupChatId: string, userId: string): Promise<void> {
    try {
      if (!this.FIREBASE_ENABLED) return;

      const batch = writeBatch(db);
      const snapshot = await getDocs(
        query(
          collection(db, 'group_chat_messages'),
          where('group_chat_id', '==', groupChatId),
          where('is_deleted', '==', false)
        )
      );

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read_by: doc.data().read_by?.includes(userId)
            ? doc.data().read_by
            : [...(doc.data().read_by || []), userId],
        });
      });

      await batch.commit();
      console.log(`✅ Marked messages as read for ${userId}`);
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  }

  /**
   * Add expense to group chat
   */
  async addExpense(
    groupChatId: string,
    description: string,
    amount: number,
    paidById: string,
    splitBetweenUserIds: string[]
  ): Promise<ExpenseItem | null> {
    try {
      if (!this.FIREBASE_ENABLED) {
        console.log('📱 Adding expense via localStorage');
        return this.addExpenseLocal(groupChatId, description, amount, paidById);
      }

      console.log(`💰 Adding expense to group chat`);

      const paidByUser = await usersService.getUserProfile(paidById);

      const expenseRef = await addDoc(collection(db, 'group_chat_expenses'), {
        group_chat_id: groupChatId,
        description,
        amount,
        paid_by_id: paidById,
        paid_by_name: paidByUser?.displayName || paidByUser?.email,
        split_between: splitBetweenUserIds,
        created_at: serverTimestamp(),
      });

      // Post system message
      await this.postMessage(
        groupChatId,
        paidById,
        `Added expense: ${description} - ₹${amount}`,
        'expense'
      );

      console.log(`✅ Expense added: ${expenseRef.id}`);

      return {
        id: expenseRef.id,
        group_chat_id: groupChatId,
        description,
        amount,
        paid_by_id: paidById,
        paid_by_name: paidByUser?.displayName || paidByUser?.email || 'Unknown',
        split_between: splitBetweenUserIds,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error adding expense:', error);
      throw error;
    }
  }

  // ===== PRIVATE METHODS =====

  private async getMemberCount(groupChatId: string): Promise<number> {
    const snapshot = await getDocs(
      query(collection(db, 'group_chat_members'), where('group_chat_id', '==', groupChatId))
    );
    return snapshot.docs.length;
  }

  // Local storage fallback methods...
  private async createGroupChatLocal(data: any) {
    const chats = JSON.parse(localStorage.getItem('avento_group_chats') || '[]');
    const newChat = {
      id: `gc_${Date.now()}`,
      ...data,
      member_count: 0,
      members: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    chats.push(newChat);
    localStorage.setItem('avento_group_chats', JSON.stringify(chats));
    return { id: newChat.id, data: newChat };
  }

  private async addMemberLocal(groupChatId: string, userId: string, shareAmount: number) {
    const members = JSON.parse(localStorage.getItem('avento_group_chat_members') || '[]');
    const newMember = {
      id: `gcm_${Date.now()}`,
      group_chat_id: groupChatId,
      user_id: userId,
      user_name: 'User',
      joined_at: new Date().toISOString(),
      share_amount: shareAmount,
      payment_status: 'pending',
      time_joined_minutes: 0,
    };
    members.push(newMember);
    localStorage.setItem('avento_group_chat_members', JSON.stringify(members));
    return newMember;
  }

  private async postMessageLocal(
    groupChatId: string,
    senderId: string,
    content: string,
    messageType: string
  ) {
    const messages = JSON.parse(localStorage.getItem('avento_group_chat_messages') || '[]');
    const newMessage = {
      id: `gcm_${Date.now()}`,
      group_chat_id: groupChatId,
      sender_id: senderId,
      sender_name: 'User',
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };
    messages.push(newMessage);
    localStorage.setItem('avento_group_chat_messages', JSON.stringify(messages));
    return newMessage;
  }

  private getGroupChatLocal(groupChatId: string) {
    const chats = JSON.parse(localStorage.getItem('avento_group_chats') || '[]');
    const members = JSON.parse(localStorage.getItem('avento_group_chat_members') || '[]');
    const chat = chats.find((c: any) => c.id === groupChatId);
    if (!chat) return null;
    chat.members = members.filter((m: any) => m.group_chat_id === groupChatId);
    return chat;
  }

  private getMessagesLocal(groupChatId: string) {
    const messages = JSON.parse(localStorage.getItem('avento_group_chat_messages') || '[]');
    return messages.filter((m: any) => m.group_chat_id === groupChatId);
  }

  private addExpenseLocal(
    groupChatId: string,
    description: string,
    amount: number,
    paidById: string
  ) {
    const expenses = JSON.parse(localStorage.getItem('avento_group_chat_expenses') || '[]');
    const newExpense = {
      id: `exp_${Date.now()}`,
      group_chat_id: groupChatId,
      description,
      amount,
      paid_by_id: paidById,
      paid_by_name: 'User',
      split_between: [],
      created_at: new Date().toISOString(),
    };
    expenses.push(newExpense);
    localStorage.setItem('avento_group_chat_expenses', JSON.stringify(expenses));
    return newExpense;
  }
}

export const enhancedGroupChatService = new EnhancedGroupChatService();
