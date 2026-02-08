import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseAuth } from '../services/supabaseAuthService';

interface User {
  id: string;
  email: string;
  name: string;
  age?: string;
  phone?: string;
  profession?: string;
  onboarding_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: { user: User } | null; error: any }>;
  signUp: (email: string, password: string, userData: { name: string }) => Promise<{ data: { user: User } | null; error: any }>;
  signInWithGoogle: () => Promise<{ data: { user: User } | null; error: any }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Supabase auth changes
    const unsubscribe = supabaseAuth.onAuthStateChanged((authUser) => {
      if (authUser) {
        const user: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          age: authUser.user_metadata?.age,
          phone: authUser.user_metadata?.phone,
          profession: authUser.user_metadata?.profession,
          onboarding_completed: authUser.user_metadata?.onboarding_completed || false,
        };
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Handle demo account
      if (email === 'demo@avento.com' && password === 'demo123') {
        const user: User = {
          id: 'demo_user',
          email: email,
          name: 'Shubh Heda',
          age: '25',
          phone: '+91-9876543210',
          profession: 'Product Manager',
          onboarding_completed: true,
        };
        setUser(user);
        setLoading(false);
        return { data: { user }, error: null };
      }

      // Use Supabase sign in
      const result = await supabaseAuth.signIn(email, password);
      if (result && result.user) {
        const user: User = {
          id: result.user.id,
          email: result.user.email || '',
          name: result.user.user_metadata?.full_name || email.split('@')[0],
        };
        setUser(user);
        setLoading(false);
        return { data: { user }, error: null };
      }
      setLoading(false);
      return { data: null, error: result?.error };
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, userData: { name: string }) => {
    setLoading(true);
    try {
      const result = await supabaseAuth.signUp(email, password, userData.name);
      if (result && result.user) {
        const user: User = {
          id: result.user.id,
          email: result.user.email || '',
          name: userData.name,
        };
        setUser(user);
        setLoading(false);
        return { data: { user }, error: null };
      }
      setLoading(false);
      return { data: null, error: result?.error };
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabaseAuth.signOut();
    setUser(null);
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await supabaseAuth.signInWithGoogle();
      if (result && result.user) {
        const user: User = {
          id: result.user.id,
          email: result.user.email || '',
          name: result.user.user_metadata?.full_name || result.user.email?.split('@')[0] || 'Google User',
        };
        setUser(user);
        setLoading(false);
        return { data: { user }, error: null };
      }
      setLoading(false);
      return { data: null, error: result?.error };
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update localStorage for demo mode
      const currentUser = localStorage.getItem('avento_current_user');
      if (currentUser) {
        const userObj = JSON.parse(currentUser);
        localStorage.setItem('avento_current_user', JSON.stringify({
          ...userObj,
          user_metadata: {
            ...userObj.user_metadata,
            full_name: updates.name || userObj.user_metadata?.full_name,
            age: updates.age || userObj.user_metadata?.age,
            phone: updates.phone || userObj.user_metadata?.phone,
            profession: updates.profession || userObj.user_metadata?.profession,
            onboarding_completed: updates.onboarding_completed !== undefined ? updates.onboarding_completed : userObj.user_metadata?.onboarding_completed,
          }
        }));
        
        // Trigger storage event for other listeners
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'avento_current_user',
          newValue: localStorage.getItem('avento_current_user') || '',
        }));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, updateUserProfile }}>
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
