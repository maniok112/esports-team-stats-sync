
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Check for environment variables and provide fallback for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a more helpful error message if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase environment variables are missing. Make sure to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Supabase project settings."
  );
}

// Create a mock client if we're in development and missing credentials
let supabase;

try {
  supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder-url.supabase.co', 
    supabaseAnonKey || 'placeholder-key'
  );
  
  // Test if the client is working by making a simple query
  supabase.from('players').select('count', { count: 'exact', head: true })
    .then(() => {
      console.log('Supabase connection successful');
    })
    .catch((err) => {
      console.error('Supabase connection failed:', err.message);
      
      // If we're in development, we'll continue with mock data
      if (import.meta.env.DEV) {
        console.info('Using mock data in development mode');
      }
    });
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  
  // Create a minimal mock client for development
  if (import.meta.env.DEV) {
    console.info('Using mock data in development mode');
    // We'll still export something so the app doesn't crash
    supabase = {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } }),
        eq: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } }),
        single: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } }),
        order: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } }),
        limit: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } })
      }),
      rpc: () => Promise.resolve({ data: null, error: { message: 'Mock client used' } })
    };
  }
}

export { supabase };
export default supabase;
