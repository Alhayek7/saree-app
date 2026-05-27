// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Mock Supabase client for development (when no credentials)
const createMockSupabase = () => {
  console.warn('⚠️ Using mock Supabase client. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  
  return {
    auth: {
      getUser: async () => ({ data: { user: { user_metadata: { name: 'Test User' } } }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signIn: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: (table: string) => ({
      insert: async (data: any) => ({ data: null, error: null }),
      select: async () => ({ data: [], error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
      eq: () => ({ single: async () => ({ data: null, error: null }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      unsubscribe: () => {},
    }),
  };
};

// ✅ استخدام النسخة الوهمية فقط (للتجربة)
export const supabase = createMockSupabase();

// Helper to check if supabase is configured
export const isSupabaseConfigured = () => {
  return false;  // ✅ دائماً false للتجربة
};