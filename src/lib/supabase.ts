import { createClient } from '@supabase/supabase-js';
import { publicAnonKey } from '../utils/supabase/info';

// Prefer environment vars (Vite-style) and fall back to the checked-in key for local demos.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://kouywbotopkrgxyjqylb.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  interests: string[];
  location: string;
  category: 'sports' | 'events' | 'parties';
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_id: string;
  title: string;
  turf_name: string;
  date: string;
  time: string;
  sport: string;
  status: 'upcoming' | 'completed';
  visibility: string;
  payment_option: string;
  amount?: number;
  location?: string;
  lat?: number;
  lng?: number;
  min_players?: number;
  max_players?: number;
  turf_cost?: number;
  category: 'sports' | 'events' | 'parties';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}
