import React, { useRef } from 'react';
import {
  BookOpen,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AuthMode } from '../types';
import { BrandHeader, SiteFooter } from './LayoutChrome';

interface LandingPageProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  authMode: AuthMode;
  onChangeAuthMode: (mode: AuthMode) => void;
  authName: string;
  onChangeAuthName: (value: string) => void;
  authEmail: string;
  onChangeAuthEmail: (value: string) => void;
  authPassword: string;
  onChangeAuthPassword: (value: string) => void;
  authError: string;
  authNotice?: string;
  authLoading: boolean;
  onSubmitAuth: (e: React.FormEvent) => void;
}

export function LandingPage({
  darkMode,
  onToggleDarkMode,
  authMode,
  onChangeAuthMode,
  authName,
  onChangeAuthName,
  authEmail,
  onChangeAuthEmail,
  authPassword,
  onChangeAuthPassword,
  authError,
  authNotice,
  authLoading,
  onSubmitAuth,
}: LandingPageProps) {
  const authCardRef = useRef<HTMLDivElement | null>(null);

  function openAuthMode(mode: AuthMode) {
    onChangeAuthMode(mode);
    authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#121417] text-slate-900 dark:text-slate-100 transition-colors">
      <BrandHeader
        variant="landing"
        onBrandClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (window.location.hash && !window.location.hash.startsWith('#/')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        centerNav={
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Sanctuary
            </a>
            <a href="#ai" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              AI Reflections
            </a>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Secure Storage
            </a>
          </nav>
        }
        rightActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAuthMode('login')}
              className={`hidden sm:inline-flex px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                authMode === 'login'
                  ? 'text-slate-900 dark:text-white bg-slate-200/70 dark:bg-slate-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthMode('signup')}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              Create Account
            </button>
          </div>
        }
      />

      {/* Hero Section */}
      <main className="flex-1 w-full overflow-x-clip">
        <section className="px-4 sm:px-6 py-10 sm:py-14 lg:py-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
              <p className="text-xs font-medium tracking-wide text-amber-800 dark:text-amber-400">
                Daily Journaling · Mood Tracking · Guided Reflection
              </p>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-serif-custom leading-[1.1] text-balance">
                Your private sanctuary for daily thoughts &amp; growth.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Capture each day with calm clarity. Write freely, track emotional patterns, and receive thoughtful reflections stored securely in your personal account.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => openAuthMode('signup')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white text-sm font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 group whitespace-nowrap shrink-0"
                >
                  <span>Start Your Journal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => openAuthMode('login')}
                  className="w-full sm:w-auto px-6 py-3.5 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-sm font-medium rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In to Account
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  Private Server Storage
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  Private Account Protection
                </span>
              </div>
            </div>

            {/* Auth Card Container */}
            <div ref={authCardRef} id="auth-card" className="lg:col-span-5 w-full max-w-md mx-auto scroll-mt-24">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <h2 className="text-2xl font-serif-custom font-bold">
                    {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => onChangeAuthMode('login')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        authMode === 'login'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeAuthMode('signup')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                        authMode === 'signup'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                {authNotice && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{authNotice}</span>
                  </div>
                )}

                {authError && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={onSubmitAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label htmlFor="auth-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => onChangeAuthName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => onChangeAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={authMode === 'signup' ? 6 : undefined}
                      value={authPassword}
                      onChange={(e) => onChangeAuthPassword(e.target.value)}
                      placeholder={authMode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>{authMode === 'login' ? 'Sign In to Journal' : 'Create Account'}</span>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  {authMode === 'login' ? (
                    <p>
                      New to Luminary?{' '}
                      <button
                        type="button"
                        onClick={() => onChangeAuthMode('signup')}
                        className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                      >
                        Sign up with email
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => onChangeAuthMode('login')}
                        className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Sections matching navigation anchors */}
        <section className="border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <h2 className="text-3xl font-serif-custom font-bold text-slate-900 dark:text-slate-100">
                Built for quiet daily reflection
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Everything you need to capture moments, notice emotional shifts, and keep your thoughts private.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div id="features" className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 scroll-mt-24">
              <BookOpen className="w-6 h-6 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <h3 className="text-xl font-serif-custom font-bold">Calm Writing Sanctuary</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Organize entries by date, mood, and custom tags. Edit past reflections or remove entries anytime with full control.
              </p>
            </div>

            <div id="ai" className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 scroll-mt-24">
              <Sparkles className="w-6 h-6 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <h3 className="text-xl font-serif-custom font-bold">Thoughtful AI Reflections</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate mood-aware writing prompts, automatic titles and tags, and synthesized reflections over your recent entries.
              </p>
            </div>

            <div id="security" className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 scroll-mt-24">
              <ShieldCheck className="w-6 h-6 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              <h3 className="text-xl font-serif-custom font-bold">Secure Account Storage</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every journal entry is tied privately to your personal account with protected password authentication and secure sessions.
              </p>
            </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-lg font-serif-custom font-bold text-slate-900 dark:text-slate-100">
                Ready to begin your daily practice?
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Sign in to your sanctuary or create a private journal account in seconds.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => openAuthMode('login')}
                className="px-4 py-2.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-xl transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuthMode('signup')}
                className="px-5 py-2.5 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Start Your Journal</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        links={[
          { label: 'Sanctuary', href: '#features' },
          { label: 'AI Reflections', href: '#ai' },
          { label: 'Secure Storage', href: '#security' },
          {
            label: 'Sign In',
            href: '#/login',
            onClick: (e) => {
              e.preventDefault();
              openAuthMode('login');
            },
          },
          {
            label: 'Create Account',
            href: '#/signup',
            onClick: (e) => {
              e.preventDefault();
              openAuthMode('signup');
            },
          },
        ]}
      />
    </div>
  );
}
