// ============================================
// User Profile Service - Supabase Integration
// ============================================
import { supabase, supabaseEnabled } from '../lib/supabaseClient';

export const userProfileService = {
  // Create or update user profile in Supabase
  async upsertProfile(userId: string, userData: {
    email: string;
    full_name?: string;
    avatar_url?: string;
    age?: string;
    phone?: string;
    profession?: string;
  }) {
    if (!supabaseEnabled || !supabase) {
      console.warn('Supabase not configured');
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          user_id: userId,
          email: userData.email,
          full_name: userData.full_name || userData.email.split('@')[0],
          avatar_url: userData.avatar_url || `https://i.pravatar.cc/150?u=${userId}`,
          age: userData.age,
          phone: userData.phone,
          profession: userData.profession,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ User profile saved to Supabase:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Error saving user profile:', error);
      return { data: null, error: error.message };
    }
  },

  // Get user profile from Supabase
  async getProfile(userId: string) {
    if (!supabaseEnabled || !supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: any) {
    if (!supabaseEnabled || !supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }
};
