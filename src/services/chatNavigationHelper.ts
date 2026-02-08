/**
 * Chat Navigation Helper
 * Provides easy functions to navigate to chat screens and manage chat state
 */

import { groupChatService } from './groupChatService';
import { directMessageBackend as directMessageService } from './directMessageBackend';

export interface ChatNavigationOptions {
  onNavigate: (page: string, turfId?: string, matchId?: string, groupChatId?: string, conversationId?: string) => void;
  currentUserId?: string;
}

/**
 * Navigate to a group chat
 * Creates group chat if it doesn't exist
 */
export async function navigateToGroupChat(
  groupChatId: string,
  options: ChatNavigationOptions
): Promise<void> {
  try {
    // Verify group chat exists
    const details = await groupChatService.getGroupChat(groupChatId);
    if (details) {
      options.onNavigate('group-chat', undefined, undefined, groupChatId);
    }
  } catch (error) {
    console.error('Error navigating to group chat:', error);
    throw error;
  }
}

/**
 * Create and navigate to a new group chat for a match
 */
export async function createAndNavigateToGroupChat(
  matchId: string,
  chatName: string,
  totalCost: number,
  organizerId: string,
  organizerName: string,
  options: ChatNavigationOptions
): Promise<void> {
  try {
    const groupChat = await groupChatService.createMatchGroupChat(
      matchId,
      chatName,
      totalCost,
      organizerId,
      organizerName
    );
    options.onNavigate('group-chat', undefined, undefined, groupChat.id);
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw error;
  }
}

/**
 * Navigate to direct message conversation
 * Creates conversation if it doesn't exist
 */
export async function navigateToDirectMessage(
  userId1: string,
  userId2: string,
  options: ChatNavigationOptions
): Promise<void> {
  try {
    const conversation = await directMessageService.getOrCreateConversation(userId1, userId2);
    options.onNavigate('dm-chat', undefined, undefined, undefined, conversation.id);
  } catch (error) {
    console.error('Error navigating to direct message:', error);
    throw error;
  }
}

/**
 * Add a user to an existing group chat
 */
export async function addUserToGroupChat(
  groupChatId: string,
  userId: string,
  totalCost: number,
  timeJoinedMinutes: number = 0
): Promise<void> {
  try {
    await groupChatService.addGroupChatMember(groupChatId, userId, totalCost, timeJoinedMinutes);
  } catch (error) {
    console.error('Error adding user to group chat:', error);
    throw error;
  }
}

/**
 * Send a message to a group chat
 */
export async function sendGroupChatMessage(
  groupChatId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'image' | 'expense' | 'payment' | 'system' = 'text'
): Promise<void> {
  try {
    await groupChatService.postMessage(
      groupChatId,
      senderId,
      content,
      messageType
    );
  } catch (error) {
    console.error('Error sending group chat message:', error);
    throw error;
  }
}

/**
 * Send a direct message
 */
export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' = 'text'
): Promise<void> {
  try {
    await directMessageService.sendMessage(conversationId, senderId, receiverId, content, messageType);
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
}

/**
 * Mark payment as done in group chat
 */
export async function markGroupChatPaymentDone(
  groupChatId: string,
  userId: string
): Promise<void> {
  try {
    await groupChatService.markPaymentDone(groupChatId, userId, 0);
  } catch (error) {
    console.error('Error marking payment:', error);
    throw error;
  }
}

/**
 * Get all group chats for a user
 */
export async function getUserGroupChats(userId: string) {
  try {
    // Get group chats from localStorage for demo mode
    const chats = JSON.parse(localStorage.getItem('group_chats') || '[]');
    return chats.filter((chat: any) => chat.created_by === userId);
  } catch (error) {
    console.error('Error fetching user group chats:', error);
    return [];
  }
}

/**
 * Get all direct message conversations for a user
 */
export async function getUserConversations(userId: string) {
  try {
    return await directMessageService.getUserConversations(userId);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}
