import { createClient } from '@supabase/supabase-js';

// Note: These credentials are hardcoded; consider moving them to environment variables.
const supabaseUrl = 'https://kouywbotopkrgxyjqylb.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvdXl3Ym90b3Brcmd4eWpxeWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDQ4NDEsImV4cCI6MjA3ODcyMDg0MX0.TTdjDQIj8mLiXm5Y_edtqkm4L17Z4jh6Aa9w92vAYoI';

export const supabase = createClient(supabaseUrl, supabaseKey);