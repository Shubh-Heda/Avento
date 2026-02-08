// ============================================
// Supabase Authentication & Backend Service
// ============================================
import { supabase, supabaseEnabled } from '../lib/supabaseClient';
import { userProfileService } from './userProfileService';

// Check if Supabase is configured
const SUPABASE_ENABLED = supabaseEnabled && supabase !== null;

// Local storage keys for demo mode
const STORAGE_KEYS = {
  users: 'avento_supabase_demo_users',
  events: 'avento_supabase_demo_events',
  matches: 'avento_supabase_demo_matches',
  feedback: 'avento_supabase_demo_feedback',
};

// ==================== Authentication ====================

export const supabaseAuth = {
  // Sign up new user with email and password
  signUp: async (email: string, password: string, displayName: string) => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE: Use localStorage
      const mockUser = {
        id: `user-${Date.now()}`,
        email: email,
        user_metadata: {
          full_name: displayName,
        },
        created_at: new Date().toISOString(),
      };

      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
      users.push(mockUser);
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
      localStorage.setItem('avento_current_user', JSON.stringify(mockUser));

      console.log('✅ [DEMO] User registered:', displayName);
      return { user: mockUser, error: null };
    }

    try {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });

      if (error) throw error;

      // Create user profile in Supabase
      if (data.user) {
        await userProfileService.upsertProfile(data.user.id, {
          email: data.user.email || '',
          full_name: displayName,
        });
      }

      console.log('✅ User signed up:', email);
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('❌ Sign up error:', error.message);
      return { user: null, error: error.message };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        return { user: null, error: 'User not found' };
      }

      localStorage.setItem('avento_current_user', JSON.stringify(user));
      console.log('✅ [DEMO] User signed in:', email);
      return { user, error: null };
    }

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ User signed in:', email);
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('❌ Sign in error:', error.message);
      return { user: null, error: error.message };
    }
  },

  // Sign in with Google (OAuth)
  signInWithGoogle: async () => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE: Create mock Google user
      const mockUser = {
        id: `google-${Date.now()}`,
        email: `demo-google-${Date.now()}@gmail.com`,
        user_metadata: {
          full_name: 'Google Demo User',
          avatar_url: 'https://i.pravatar.cc/150?u=google',
        },
        created_at: new Date().toISOString(),
      };

      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
      users.push(mockUser);
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
      localStorage.setItem('avento_current_user', JSON.stringify(mockUser));

      // Also create profile in "Supabase"
      await userProfileService.upsertProfile(mockUser.id, {
        email: mockUser.email,
        full_name: mockUser.user_metadata.full_name,
        avatar_url: mockUser.user_metadata.avatar_url,
      });

      console.log('✅ [DEMO] Google user signed in');
      return { user: mockUser, error: null };
    }

    try {
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Note: OAuth redirect will handle the rest
      console.log('✅ Google sign-in initiated');
      return { user: null, error: null };
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error.message);
      return { user: null, error: error.message };
    }
  },

  // Sign out current user
  signOut: async () => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE
      localStorage.removeItem('avento_current_user');
      console.log('✅ [DEMO] User signed out');
      return { error: null };
    }

    try {
      const { error } = await supabase!.auth.signOut();
      if (error) throw error;

      console.log('✅ User signed out');
      return { error: null };
    } catch (error: any) {
      console.error('❌ Sign out error:', error.message);
      return { error: error.message };
    }
  },

  // Get current user session
  getCurrentUser: async () => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE
      const user = localStorage.getItem('avento_current_user');
      return user ? JSON.parse(user) : null;
    }

    try {
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: any) => void) => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE: Check localStorage
      const user = localStorage.getItem('avento_current_user');
      callback(user ? JSON.parse(user) : null);

      // Listen to storage changes
      const handleStorageChange = () => {
        const updatedUser = localStorage.getItem('avento_current_user');
        callback(updatedUser ? JSON.parse(updatedUser) : null);
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  },
};

// ==================== User Management ====================

export const usersService = {
  // Get all users with real-time updates
  subscribeToUsers: (callback: (users: any[]) => void) => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE
      const updateUsers = () => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
        callback(users);
      };

      updateUsers();
      const interval = setInterval(updateUsers, 2000);
      return () => clearInterval(interval);
    }

    // Subscribe to profiles table
    const subscription = supabase!
      .from('profiles')
      .on('*', () => {
        supabase!
          .from('profiles')
          .select('*')
          .then(({ data }) => {
            if (data) callback(data);
          });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  // Get user profile
  getUserProfile: async (userId: string) => {
    if (!SUPABASE_ENABLED) {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
      const user = users.find((u: any) => u.id === userId);
      return { data: user || null, error: user ? null : 'User not found' };
    }

    try {
      const { data, error } = await supabase!
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
  updateUserProfile: async (userId: string, updates: any) => {
    if (!SUPABASE_ENABLED) {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
      const user = users.find((u: any) => u.id === userId);
      if (user) {
        Object.assign(user, updates);
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
      }
      return { error: null };
    }

    try {
      await supabase!
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Get online users count
  getOnlineUsersCount: async () => {
    if (!SUPABASE_ENABLED) {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
      return users.length;
    }

    try {
      const { count } = await supabase!
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      return count || 0;
    } catch (error) {
      console.error('Error getting online users:', error);
      return 0;
    }
  },
};

// ==================== Matches Management ====================

export const matchesService = {
  // Subscribe to matches
  subscribeToMatches: (callback: (matches: any[]) => void) => {
    if (!SUPABASE_ENABLED) {
      // DEMO MODE
      const updateMatches = () => {
        const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.matches) || '[]');
        callback(matches);
      };

      updateMatches();
      const interval = setInterval(updateMatches, 2000);
      return () => clearInterval(interval);
    }

    // Real-time subscription
    const subscription = supabase!
      .from('matches')
      .on('*', () => {
        supabase!
          .from('matches')
          .select('*')
          .then(({ data }) => {
            if (data) callback(data);
          });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  // Add a new match
  addMatch: async (matchData: any) => {
    if (!SUPABASE_ENABLED) {
      const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.matches) || '[]');
      const newMatch = {
        id: `match-${Date.now()}`,
        ...matchData,
        created_at: new Date().toISOString(),
      };
      matches.push(newMatch);
      localStorage.setItem(STORAGE_KEYS.matches, JSON.stringify(matches));
      return { data: newMatch, error: null };
    }

    try {
      const { data, error } = await supabase!.from('matches').insert([matchData]).select().single();

      if (error) throw error;

      console.log('✅ Match saved to Supabase:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Error saving match:', error);
      return { data: null, error: error.message };
    }
  },

  // Get matches by sport
  getMatches: async (sport?: string) => {
    if (!SUPABASE_ENABLED) {
      const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.matches) || '[]');
      return sport ? matches.filter((m: any) => m.sport === sport) : matches;
    }

    try {
      let query = supabase!.from('matches').select('*');

      if (sport) {
        query = query.eq('sport', sport);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      return [];
    }
  },

  // Get match by ID
  getMatchById: async (matchId: string) => {
    if (!SUPABASE_ENABLED) {
      const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.matches) || '[]');
      return matches.find((m: any) => m.id === matchId) || null;
    }

    try {
      const { data, error } = await supabase!
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  },

  // Update match
  updateMatch: async (matchId: string, updates: any) => {
    if (!SUPABASE_ENABLED) {
      const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.matches) || '[]');
      const match = matches.find((m: any) => m.id === matchId);
      if (match) {
        Object.assign(match, updates);
        localStorage.setItem(STORAGE_KEYS.matches, JSON.stringify(matches));
      }
      return { error: null };
    }

    try {
      await supabase!
        .from('matches')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Delete match
  deleteMatch: async (matchId: string) => {
    if (!SUPABASE_ENABLED) {
      const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.matches) || '[]');
      const filtered = matches.filter((m: any) => m.id !== matchId);
      localStorage.setItem(STORAGE_KEYS.matches, JSON.stringify(filtered));
      return { error: null };
    }

    try {
      await supabase!.from('matches').delete().eq('id', matchId);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },
};

// ==================== Events Management ====================

export const eventsService = {
  // Create event
  createEvent: async (eventData: any) => {
    if (!SUPABASE_ENABLED) {
      const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.events) || '[]');
      const newEvent = {
        id: `event-${Date.now()}`,
        ...eventData,
        created_at: new Date().toISOString(),
      };
      events.push(newEvent);
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
      return { data: newEvent, error: null };
    }

    try {
      const { data, error } = await supabase!
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Get all events
  getEvents: async () => {
    if (!SUPABASE_ENABLED) {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.events) || '[]');
    }

    try {
      const { data, error } = await supabase!.from('events').select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  // Subscribe to events
  subscribeToEvents: (callback: (events: any[]) => void) => {
    if (!SUPABASE_ENABLED) {
      const updateEvents = () => {
        const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.events) || '[]');
        callback(events);
      };

      updateEvents();
      const interval = setInterval(updateEvents, 2000);
      return () => clearInterval(interval);
    }

    const subscription = supabase!
      .from('events')
      .on('*', () => {
        supabase!
          .from('events')
          .select('*')
          .then(({ data }) => {
            if (data) callback(data);
          });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};

// Re-export firebaseAuth as default for compatibility
export const firebaseAuth = supabaseAuth;
