/**
 * Direct Message Backend (Supabase)
 * Enables 1-1 chat with conversations + messages
 */
// Firebase imports removed - using Supabase
// import { isFirebaseConfigured, db } from '../lib/firebase';
import { supabase, supabaseEnabled } from '../lib/supabaseClient';
// Firestore imports removed
// import { collection, doc, getDocs, query, where, addDoc, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { directMessageService as firebaseDirectMessages } from './firebaseService';

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
  updated_at?: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  participants: string[];
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at?: string;
}

const FIREBASE_ENABLED = isFirebaseConfigured();

const STORAGE_KEYS = {
  conversations: 'avento_firebase_demo_conversations',
  directMessages: 'avento_firebase_demo_direct_messages'
};

function getConversationId(userId1: string, userId2: string) {
  const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  return `${u1}_${u2}`;
}

export const directMessageBackend = {
  async getConversation(conversationId: string): Promise<Conversation | null> {
    if (!FIREBASE_ENABLED) {
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      return conversations.find((c: Conversation) => c.id === conversationId) ?? null;
    }
    try {
      const existing = await firebaseDirectMessages.getConversation(conversationId);
      return (existing?.data ?? null) as Conversation | null;
    } catch (error) {
      console.warn('Get conversation error:', error);
      return null;
    }
  },

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    const conversationId = getConversationId(user1, user2);
    console.log(`📞 Creating/getting conversation: ${conversationId}`);

    if (!FIREBASE_ENABLED) {
      console.log('📱 Using localStorage for conversations');
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      let conv = conversations.find((c: Conversation) => c.id === conversationId);
      if (!conv) {
        conv = {
          id: conversationId,
          user1_id: user1,
          user2_id: user2,
          participants: [user1, user2],
          created_at: new Date().toISOString()
        };
        conversations.unshift(conv);
        localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
        console.log(`✅ Conversation created in localStorage: ${conversationId}`);
      }
      return conv;
    }

    try {
      const convRef = doc(db, 'conversations', conversationId);
      const existing = await firebaseDirectMessages.getConversation(conversationId);
      if (existing?.data) {
        console.log(`✅ Conversation exists: ${conversationId}`);
        return existing.data as Conversation;
      }

      await setDoc(
        convRef,
        {
          user1_id: user1,
          user2_id: user2,
          participants: [user1, user2],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        },
        { merge: true }
      );
      console.log(`✅ Conversation created in Firebase: ${conversationId}`);
    } catch (error) {
      console.warn('Create conversation error:', error);
    }

    return {
      id: conversationId,
      user1_id: user1,
      user2_id: user2,
      participants: [user1, user2],
      created_at: new Date().toISOString()
    };
  },

  async sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string,
    mediaThumbnail?: string
  ): Promise<DirectMessage> {
    console.log(`💬 Sending message to ${conversationId}`);
    const messagePayload = {
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      media_thumbnail: mediaThumbnail,
      is_read: false,
      is_deleted: false
    };

    if (!FIREBASE_ENABLED) {
      console.log('📱 Saving message to localStorage');
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.directMessages) || '[]');
      const newMessage: DirectMessage = {
        id: `dm-${Date.now()}`,
        conversation_id: conversationId,
        ...messagePayload,
        created_at: new Date().toISOString()
      } as DirectMessage;
      messages.unshift(newMessage);
      localStorage.setItem(STORAGE_KEYS.directMessages, JSON.stringify(messages));
      console.log(`✅ Message saved: ${newMessage.id}`);
      return newMessage;
    }

    try {
      console.log('🔥 Saving message to Firebase...');
      const result = await firebaseDirectMessages.sendMessage(conversationId, messagePayload);
      if (result.error) throw new Error(result.error);

      await updateDoc(doc(db, 'conversations', conversationId), {
        last_message: content,
        last_message_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }).catch(() => undefined);

      console.log(`✅ Message sent via Firebase: ${result.data?.id}`);
      return result.data as DirectMessage;
    } catch (error) {
      console.error('❌ Send message error:', error);
      throw error;
    }
  },

  async getMessages(conversationId: string): Promise<DirectMessage[]> {
    console.log(`📥 Loading messages for ${conversationId}`);
    if (!FIREBASE_ENABLED) {
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.directMessages) || '[]');
      const filtered = messages.filter((m: DirectMessage) => m.conversation_id === conversationId);
      console.log(`✅ Got ${filtered.length} messages from localStorage`);
      return filtered as DirectMessage[];
    }
    try {
      const result = await firebaseDirectMessages.getMessages(conversationId);
      console.log(`✅ Got ${(result.data || []).length} messages from Firebase`);
      return (result.data || []) as DirectMessage[];
    } catch (error) {
      console.warn('❌ Get messages error:', error);
      return [];
    }
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    if (!FIREBASE_ENABLED) return;

    const q = query(
      collection(db, 'direct_messages'),
      where('conversation_id', '==', conversationId),
      where('receiver_id', '==', userId),
      where('is_read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.update(d.ref, { is_read: true }));
    await batch.commit();
  },

  async getUserConversations(userId: string): Promise<Conversation[]> {
    console.log(`👥 Loading conversations for user ${userId}`);
    if (!FIREBASE_ENABLED) {
      const conversations = JSON.parse(localStorage.getItem(STORAGE_KEYS.conversations) || '[]');
      const filtered = conversations.filter((c: Conversation) => c.participants?.includes(userId));
      console.log(`✅ Got ${filtered.length} conversations from localStorage`);
      return filtered;
    }

    try {
      const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
      const snapshot = await getDocs(q);
      console.log(`✅ Got ${snapshot.docs.length} conversations from Firebase`);
      return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Conversation));
    } catch (error) {
      console.warn('❌ Get conversations error:', error);
      return [];
    }
  },

  subscribeToMessages(conversationId: string, callback: (messages: DirectMessage[]) => void) {
    return firebaseDirectMessages.subscribeToMessages(conversationId, callback as any);
  }
};

export default directMessageBackend;
