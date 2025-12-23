import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: { user: User } | null; error: any }>;
  signUp: (email: string, password: string, userData: { name: string }) => Promise<{ data: { user: User } | null; error: any }>;
  signInWithGoogle: () => Promise<{ data: { user: User } | null; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't check for existing session - user must log in each time
    setLoading(false);

    // Listen for auth changes during current session only
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        });
      } else {
        setUser(null);
      }
    });

    // Clear session when page is closed/refreshed
    const handleBeforeUnload = () => {
      supabase.auth.signOut();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (data?.user) {
      const newUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0],
      };
      setUser(newUser);
      setLoading(false);
      return { data: { user: newUser }, error: null };
    }
    
    setLoading(false);
    return { data: null, error };
  };

  const signUp = async (email: string, password: string, userData: { name: string }) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.name,
          name: userData.name,
        },
      },
    });
    
    if (data?.user) {
      const newUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: userData.name,
      };
      setUser(newUser);
      setLoading(false);
      return { data: { user: newUser }, error: null };
    }
    
    setLoading(false);
    return { data: null, error };
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    setLoading(false);
    
    if (error) {
      return { data: null, error };
    }
    
    // The actual user will be set by the onAuthStateChange listener after redirect
    return { data: { user: null }, error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
