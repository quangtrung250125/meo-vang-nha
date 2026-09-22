import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://gsngpfdxpneqkgwkbyts.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_vmfUYiUkE2mYA4srZ74yIg_kNl65doG';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
