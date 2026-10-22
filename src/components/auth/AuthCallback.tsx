import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from '../../lib/router';
import { getSupabaseClient } from '../../lib/supabase';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const { navigate } = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleAuthCallback = async () => {
      const client = getSupabaseClient();
      if (!client) {
        setStatus('error');
        setErrorMessage('Supabase client could not be initialized. Please check configuration.');
        return;
      }

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        // 1. Check for error parameters in query string or URL hash
        const errorDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description') ||
          searchParams.get('error') ||
          hashParams.get('error');

        if (errorDesc) {
          setStatus('error');
          setErrorMessage(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
          return;
        }

        const targetRedirect = searchParams.get('redirect') || '/app';

        // 2. PKCE flow: If auth code is present, exchange it for a session
        const authCode = searchParams.get('code');
        if (authCode) {
          const { data, error: exchangeError } = await client.auth.exchangeCodeForSession(authCode);
          if (exchangeError) {
            setStatus('error');
            setErrorMessage(exchangeError.message);
            return;
          }

          if (data?.session) {
            setStatus('success');
            setTimeout(() => {
              navigate(targetRedirect, { replace: true });
            }, 1000);
            return;
          }
        }

        // 3. Implicit or restored session check
        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (session) {
          setStatus('success');
          setTimeout(() => {
            navigate(targetRedirect, { replace: true });
          }, 1000);
          return;
        }

        // 4. Listen for auth state change if Supabase is still parsing the hash
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, currentSession) => {
          if (currentSession) {
            subscription.unsubscribe();
            setStatus('success');
            setTimeout(() => {
              navigate(targetRedirect, { replace: true });
            }, 1000);
          }
        });

        // 5. Fallback timer if no session or code is detected
        const timer = setTimeout(() => {
          subscription.unsubscribe();
          navigate('/login', { replace: true });
        }, 2500);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Authentication verification encountered an unexpected failure.'
        );
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#070c1e] text-slate-100 flex items-center justify-center p-6 selection:bg-teal-500/30 selection:text-teal-200">
      {/* Subtle Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-teal-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="bg-[#0a1128] border border-slate-800 rounded-xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl relative z-10">
        {status === 'verifying' && (
          <div className="space-y-3">
            <Loader2 className="w-9 h-9 text-teal-400 animate-spin mx-auto" />
            <h3 className="text-base font-semibold text-white">Verifying Municipal Session</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exchanging confirmation token and restoring your urban planning workspace...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/40 mx-auto flex items-center justify-center text-teal-300">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Email Confirmed Successfully</h3>
            <p className="text-xs text-slate-400">Redirecting to CityTwin simulator dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-300">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Confirmation Failed</h3>
            <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 p-3 rounded-lg leading-relaxed text-left">
              {errorMessage || 'The verification link is invalid, expired, or has already been consumed.'}
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors shadow-md"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/signup', { replace: true })}
                className="w-full py-2 px-3 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Create a New Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
