import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gsngpfdxpneqkkgwkbyts.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_vmfUYiUkE2mYA4srZ74yIg_kNl65doG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
