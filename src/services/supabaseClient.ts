
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { supabase as defaultClient } from '@/integrations/supabase/client';

// Use the configured Supabase client from integrations/supabase/client
// This client is automatically configured with the correct URL and keys
const supabase = defaultClient;

console.log('Supabase client initialized');

// Test if the client is working
supabase.from('players').select('count', { count: 'exact', head: true })
  .then(() => {
    console.log('Supabase connection successful');
  })
  .catch((err) => {
    console.error('Supabase connection failed:', err.message);
  });

export { supabase };
export default supabase;
