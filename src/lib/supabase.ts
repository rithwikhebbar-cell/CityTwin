import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes a user-provided Supabase URL by trimming whitespace,
 * stripping wrapping quotes, removing trailing slashes, and removing
 * any accidentally appended '/rest/v1' subpaths (which cause PostgREST
 * to throw "Invalid path specified in request URL").
 */
export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip surrounding quotes (double or single)
  url = url.replace(/^["']+|["']+$/g, '').trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Strip trailing /rest/v1 or /rest/v1/ (case-insensitive)
  url = url.replace(/\/rest\/v1\/?$/i, '');
  // Re-strip any trailing slash
  url = url.replace(/\/+$/, '');
  return url;
}

/**
 * Normalizes a user-provided Supabase anon/publishable key by trimming
 * whitespace and removing any accidental wrapping quotes.
 */
export function normalizeSupabaseKey(rawKey?: string): string {
  if (!rawKey) return '';
  let key = rawKey.trim();
  key = key.replace(/^["']+|["']+$/g, '').trim();
  return key;
}

/**
 * Normalizes an application base URL by trimming whitespace,
 * stripping wrapping quotes, and removing trailing slashes.
 */
export function normalizeAppUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/^["']+|["']+$/g, '').trim();
  url = url.replace(/\/+$/, '');
  return url;
}

/**
 * Resolves the canonical public application URL.
 * Never hardcodes localhost:3000 in production or mobile testing.
 *
 * Resolution order:
 * 1. Environment variable VITE_APP_URL or APP_URL (if provided and non-empty)
 * 2. In browser environments: window.location.origin (the actual reachable host)
 * 3. Fallback: 'http://localhost:3000' (default when window is undefined)
 */
export function getCanonicalAppUrl(): string {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) ||
    (typeof process !== 'undefined' && (process.env?.VITE_APP_URL || process.env?.APP_URL)) ||
    '';
  const cleanEnv = normalizeAppUrl(envUrl);
  if (cleanEnv) {
    return cleanEnv;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeAppUrl(window.location.origin);
  }
  return 'http://localhost:3000';
}

/**
 * Generates an absolute redirect URL for Supabase Auth email confirmation or OAuth callback.
 * Ensures the redirect points to the real, reachable application origin.
 */
export function getAuthCallbackUrl(targetPath: string = '/auth/callback'): string {
  const base = getCanonicalAppUrl();
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  return `${base}${cleanPath}`;
}

export interface SupabaseConfigValidation {
  isConfigured: boolean;
  isValid: boolean;
  url: string;
  error?: string;
  isPlaceholder?: boolean;
}

/**
 * Validates the Supabase configuration from environment variables.
 */
export function validateSupabaseConfig(): SupabaseConfigValidation {
  const rawUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    '';
  const rawKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  const cleanUrl = normalizeSupabaseUrl(rawUrl);
  const cleanKey = normalizeSupabaseKey(rawKey);

  if (!cleanUrl || !cleanKey) {
    return {
      isConfigured: false,
      isValid: false,
      url: cleanUrl,
      error: 'Supabase credentials not configured in environment (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing).',
    };
  }

  if (
    cleanUrl.includes('your-project.supabase.co') ||
    cleanKey.includes('your-supabase-anon-key')
  ) {
    return {
      isConfigured: false,
      isValid: false,
      url: cleanUrl,
      isPlaceholder: true,
      error: 'Placeholder Supabase URL or anon key detected. Please configure your actual Supabase project credentials in environment variables.',
    };
  }

  try {
    const parsed = new URL(cleanUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        isConfigured: true,
        isValid: false,
        url: cleanUrl,
        error: `Invalid protocol "${parsed.protocol}" in Supabase URL. Must use https://`,
      };
    }

    if (cleanKey.includes('service_role')) {
      console.warn(
        'CityTwin Security Alert: Service-role key detected in browser configuration. Never expose service-role key; use the anon/publishable key.'
      );
    }

    return {
      isConfigured: true,
      isValid: true,
      url: cleanUrl,
    };
  } catch (err: unknown) {
    return {
      isConfigured: true,
      isValid: false,
      url: cleanUrl,
      error: `Malformed Supabase URL: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export const isSupabaseConfigured = (): boolean => {
  const validation = validateSupabaseConfig();
  return validation.isConfigured && validation.isValid;
};

export const getSupabaseConfig = () => {
  const validation = validateSupabaseConfig();
  return {
    url: validation.isValid ? validation.url : null,
    isConfigured: validation.isConfigured && validation.isValid,
    error: validation.error,
  };
};

let clientInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const validation = validateSupabaseConfig();
  if (!validation.isValid) {
    return null;
  }

  const rawKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    '';
  const cleanKey = normalizeSupabaseKey(rawKey);

  // Return cached client instance if credentials have not changed
  if (clientInstance && lastUsedUrl === validation.url && lastUsedKey === cleanKey) {
    return clientInstance;
  }

  // Initialize official Supabase client with clean base URL
  const isBrowser = typeof window !== 'undefined';
  clientInstance = createClient(validation.url, cleanKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });
  lastUsedUrl = validation.url;
  lastUsedKey = cleanKey;

  return clientInstance;
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  count?: number;
  statusCode?: number;
  tableMissing?: boolean;
}> {
  const validation = validateSupabaseConfig();
  if (!validation.isConfigured) {
    return {
      connected: false,
      message: validation.error || 'Supabase credentials not configured in environment.',
    };
  }
  if (!validation.isValid) {
    return {
      connected: false,
      message: validation.error || 'Invalid Supabase configuration.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Failed to initialize Supabase client with provided credentials.',
    };
  }

  try {
    // Query scenarios table using standard Supabase client syntax
    const { data, count, error, status } = await client
      .from('scenarios')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.message.toLowerCase().includes('could not find the table') ||
        error.message.toLowerCase().includes('schema cache');

      if (isMissingTable) {
        return {
          connected: false,
          tableMissing: true,
          statusCode: status,
          message: `Connected to Supabase endpoint (${validation.url}), but the 'scenarios' table was not found in schema cache. Run migration 'supabase/migrations/20261014000000_create_scenarios_table.sql' in your Supabase SQL Editor.`,
        };
      }

      return {
        connected: false,
        statusCode: status,
        message: `Supabase query error: ${error.message}`,
      };
    }

    return {
      connected: true,
      statusCode: status,
      message: `Successfully connected to Supabase PostgreSQL database at ${validation.url}.`,
      count: count ?? (data ? data.length : 0),
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Network or connection failure: ${errMsg}`,
    };
  }
}
