import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env) ? process.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dejcaioztgpqkvmbauat.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlamNhaW96dGdwcWt2bWJhdWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzU3NTcsImV4cCI6MjEwNTY1MTc1N30.yZgRl-qV5mOn4JmSwt0sulfIMXIX3MDIEzS2DxSI3yc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
