import { createClient, SupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value: string): string {
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!cleaned) return '';
  if (/^[a-z0-9-]+$/i.test(cleaned)) {
    return `https://${cleaned}.supabase.co`;
  }
  return cleaned.replace(/\/rest\/v1$/i, '').replace(/\/+$/, '');
}

const rawUrl = typeof import.meta.env.VITE_SUPABASE_URL === 'string' ? import.meta.env.VITE_SUPABASE_URL : '';
const rawKey = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string' ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

const supabaseUrl = normalizeSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

let client: SupabaseClient | null = null;
let configError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  configError =
    'Supabase is not configured for this build. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting environment variables and redeploy.';
} else if (!/^https?:\/\/.+/i.test(supabaseUrl)) {
  configError =
    'VITE_SUPABASE_URL must be a valid https:// URL (for example, https://your-project-ref.supabase.co).';
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    configError =
      err instanceof Error ? err.message : 'Unable to initialize Supabase client.';
    client = null;
  }
}

export const supabase = client;
export const isSupabaseConfigured = client !== null;
export const supabaseConfigError = configError;
