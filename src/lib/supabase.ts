import { createClient } from '@supabase/supabase-js';

// Supabase config — la clé anon est publique par conception (safe côté client)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://riodeaaqjckfkyvtjyph.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb2RlYWFxamNrZmt5dnRqeXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2ODEzNjksImV4cCI6MjA2NDI1NzM2OX0.5ZffvQm9dmFcaBg4ngtZrw_E6O8A3OU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
