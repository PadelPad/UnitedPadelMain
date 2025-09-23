// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const envUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  process.env.VITE_SUPABASE_URL ||
  process.env.REACT_APP_SUPABASE_URL;

const envAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

// ✅ Your provided project (anon) values as fallback so things work today
const FALLBACK_URL = 'https://rodhevjnrxiveaacyqwm.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZGhldmpucnhpdmVhYWN5cXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MjQ0NTksImV4cCI6MjA2MDQwMDQ1OX0.VH0qy-oVFUIEQ7S6PtwAOBFAwBmdUIYQRF34RT3DRuE';

const supabaseUrl = envUrl || FALLBACK_URL;
const supabaseAnonKey = envAnonKey || FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
