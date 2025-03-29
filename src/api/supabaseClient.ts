
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://koxsapppoyxekhoelcqt.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveHNhcHBwb3l4ZWtob2VsY3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODczODUsImV4cCI6MjA1ODc2MzM4NX0.BNNYAi0D-GQ8AvYzNYw6G3-zJ-gRB7N6J7dmJM75Jl0';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function handleSupabasePromise<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error('Supabase error:', error);
    throw error;
  }
}
