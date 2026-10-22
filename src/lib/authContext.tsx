import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured, getAuthCallbackUrl } from './supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, customRedirectTo?: string) => Promise<{ success: boolean; confirmationRequired?: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let mounted = true;
    const client = getSupabaseClient();

    if (!client) {
      setLoading(false);
      return;
    }

    // 1. Check current session
    client.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('CityTwin Supabase getSession warning:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      console.warn('CityTwin Auth initialization error:', err);
      setLoading(false);
    });

    // 2. Subscribe to auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearError = () => setAuthError(null);

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    const client = getSupabaseClient();
    if (!client) {
      const msg = 'Supabase authentication is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const errorMsg = error.message || 'Failed to sign in. Please verify your email and password.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during sign in.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signUpWithEmail = async (email: string, password: string, customRedirectTo?: string) => {
    setAuthError(null);
    const client = getSupabaseClient();
    if (!client) {
      const msg = 'Supabase authentication is not configured. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const emailRedirectTo = customRedirectTo || getAuthCallbackUrl('/auth/callback');
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        let errorMsg = error.message;
        if (error.message.toLowerCase().includes('already registered')) {
          errorMsg = 'An account with this email address already exists. Please sign in instead.';
        }
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // In Supabase, if email confirmation is enabled, session is null until verified
      const confirmationRequired = !data.session;
      if (data.session) {
        setUser(data.user);
        setSession(data.session);
      }

      return {
        success: true,
        confirmationRequired,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during registration.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setAuthError(null);
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('CityTwin signOut warning:', err);
      }
    }
    setUser(null);
    setSession(null);
  };

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isConfigured,
      authError,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      clearError,
    }),
    [user, session, loading, isConfigured, authError]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
