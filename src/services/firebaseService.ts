// ============================================
// Firebase Service - DEPRECATED
// All functionality migrated to Supabase - kept for backward compatibility
// ============================================
import {
  supabaseAuth,
  usersService,
  matchesService,
  eventsService,
} from './supabaseAuthService';

// Re-export everything for backward compatibility
export const firebaseAuth = supabaseAuth;
export { usersService, matchesService, eventsService };

// Export empty stub services for unused features
export const trustScoreService = { updateTrustScore: async () => ({ error: null }), getTrustScoreHistory: async () => ({ data: null, error: null }) };
export const feedbackService = { submitFeedback: async () => ({ error: null }), getFeedback: async () => ({ data: null, error: null }) };
export const groupChatService = { createGroupChat: async () => ({ data: null, error: null }), getGroupChat: async () => ({ data: null, error: null }), addGroupChatMember: async () => ({ data: null, error: null }), postMessage: async () => ({ data: null, error: null }), getMessages: async () => ({ data: null, error: null }), subscribeToMessages: () => () => {} };
export const directMessageService = { getConversation: async () => ({ data: null, error: null }), sendMessage: async () => ({ data: null, error: null }), getMessages: async () => ({ data: null, error: null }), subscribeToMessages: () => () => {} };
export const chatModerationService = { recordAction: async () => ({ error: null }) };
export const initializeMockData = async () => {};

export const profileService = usersService;
