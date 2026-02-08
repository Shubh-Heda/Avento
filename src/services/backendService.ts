// ============================================
// Backend Service - Using Supabase
// ============================================
export { firebaseAuth as backendService, usersService as profileService, matchesService as matchService, eventsService } from './supabaseAuthService';

// For backward compatibility
export const initializeDefaultData = async (_userId: string) => {
  console.log('✅ Backend data already in Supabase');
};
