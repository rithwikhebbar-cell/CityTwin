import React, { useState, useEffect } from 'react';
import { useRouter } from '../../lib/router';
import { useAuth } from '../../lib/authContext';
import { Building2, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate, queryParams } = useRouter();
  const { user, signInWithEmail, authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const redirectUrl = queryParams.get('redirect') || '/app';

  // If already logged in, redirect to app
  useEffect(() => {
    if (user) {
      navigate(redirectUrl, { replace: true });
    }
  }, [user, redirectUrl, navigate]);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signInWithEmail(trimmedEmail, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectUrl, { replace: true });
    }
  };

  const displayedError = validationError || authError;

  return (
    <div className="min-h-screen bg-[#070c1e] text-slate-100 flex flex-col justify-center py-12 px-6 sm:px-12 selection:bg-teal-500/30 selection:text-teal-200">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-teal-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Back to Homepage Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to CityTwin Homepage</span>
          </button>
        </div>

        {/* Brand Lockup */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">CityTwin</span>
        </div>
        <h2 className="text-center text-xl font-semibold text-white tracking-tight">
          Sign In to Simulator
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Access your urban transport scenarios and digital twin simulation tools.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0a1128] py-8 px-6 sm:px-8 border border-slate-800 rounded-xl shadow-xl">
          {displayedError && (
            <div className="mb-6 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{displayedError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="planner@citytwin.org"
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#060b19] border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-[#060b19] border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-teal-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Don't have an account yet? </span>
            <button
              onClick={() => navigate(`/signup${redirectUrl !== '/app' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`)}
              className="font-medium text-teal-400 hover:text-teal-300 transition-colors ml-1"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Civic-Tech Security Notice */}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          Protected with Supabase PostgreSQL Row-Level Security. Scenarios and GIS candidate records are securely scoped to your account.
        </p>
      </div>
    </div>
  );
};
