import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import {
  User as UserIcon,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, JournalEntry, FeedbackMessage, AppTab, AuthMode } from './types';
import { NAV_TABS } from './constants/navigation';
import { getLocalDateString } from './utils/date';
import { supabase } from './lib/supabase';
import { BrandHeader, SiteFooter } from './components/LayoutChrome';
import { LandingPage } from './components/LandingPage';

const EntriesView = lazy(() =>
  import('./components/EntriesView').then((m) => ({ default: m.EntriesView }))
);
const EntryEditor = lazy(() =>
  import('./components/EntryEditor').then((m) => ({ default: m.EntryEditor }))
);
const InsightsView = lazy(() =>
  import('./components/InsightsView').then((m) => ({ default: m.InsightsView }))
);
const AnalyticsView = lazy(() =>
  import('./components/AnalyticsView').then((m) => ({ default: m.AnalyticsView }))
);
const EntryModals = lazy(() =>
  import('./components/EntryModals').then((m) => ({ default: m.EntryModals }))
);

const VALID_TABS = new Set<AppTab>(['entries', 'write', 'insights', 'analytics']);

function parseHashRoute(): { tab?: AppTab; authMode?: AuthMode; isUnknownAppRoute: boolean } {
  const hash = window.location.hash;
  if (!hash.startsWith('#/')) {
    return { isUnknownAppRoute: false };
  }
  const route = hash.slice(2).toLowerCase();
  if (VALID_TABS.has(route as AppTab)) {
    return { tab: route as AppTab, isUnknownAppRoute: false };
  }
  if (route === 'login' || route === 'signup') {
    return { authMode: route, isUnknownAppRoute: false };
  }
  return { isUnknownAppRoute: true };
}

function setRouteHash(hashValue: string) {
  if (window.location.hash !== hashValue) {
    window.location.hash = hashValue;
  }
}

interface SupabaseJournalRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[] | null;
  date: string;
  created_at: string;
}

function mapJournalRow(row: SupabaseJournalRow): JournalEntry {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    mood: row.mood,
    tags: Array.isArray(row.tags) ? row.tags : [],
    date: row.date,
    createdAt: row.created_at,
  };
}

function mapSupabaseUser(supaUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): User {
  const email = supaUser.email || '';
  const metaName = typeof supaUser.user_metadata?.name === 'string' ? supaUser.user_metadata.name.trim() : '';
  return {
    id: supaUser.id,
    name: metaName || email.split('@')[0] || 'Journaler',
    email,
  };
}

function formatSupabaseError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    if (err.message.toLowerCase().includes('permission denied')) {
      return 'Database permission denied. Please run the Supabase RLS & grant SQL script in your Supabase SQL Editor.';
    }
    return err.message;
  }
  return fallback;
}

export default function App() {
  const initialRoute = useMemo(() => parseHashRoute(), []);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('luminary_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Auth form state
  const [authMode, setAuthMode] = useState<AuthMode>(() => initialRoute.authMode ?? 'login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App navigation state
  const [currentTab, setCurrentTab] = useState<AppTab>(() => initialRoute.tab ?? 'entries');

  // Feedback banner state
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Journals state
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [journalsLoading, setJournalsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');

  // Reader & delete confirmation modals
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState('reflective');
  const [formTagsInput, setFormTagsInput] = useState('');
  const [formDate, setFormDate] = useState(() => getLocalDateString());
  const [editorLoading, setEditorLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // AI Insights state + signature cache
  const [aiReflection, setAiReflection] = useState('');
  const [aiReflectionError, setAiReflectionError] = useState('');
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const reflectionSignatureRef = useRef<string | null>(null);

  const journalsSignature = useMemo(
    () =>
      journals
        .map((j) => `${j.id}:${j.date}:${j.mood}:${j.title}:${j.content.length}`)
        .join('|'),
    [journals]
  );

  // Auto-dismiss feedback
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Sync browser Back/Forward hash navigation
  useEffect(() => {
    function handleHashChange() {
      const parsed = parseHashRoute();
      if (parsed.tab) {
        setCurrentTab(parsed.tab);
        setViewingEntry(null);
        setDeleteTarget(null);
      } else if (parsed.authMode) {
        setAuthMode(parsed.authMode);
        setAuthError('');
        if (user) {
          setCurrentTab('entries');
          window.history.replaceState(null, '', '#/entries');
        }
      } else if (parsed.isUnknownAppRoute) {
        if (user) {
          setCurrentTab('entries');
          window.history.replaceState(null, '', '#/entries');
        } else {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  // Normalize unknown initial route once session resolves
  useEffect(() => {
    if (loadingSession) return;
    const parsed = parseHashRoute();
    if (user && (parsed.isUnknownAppRoute || parsed.authMode)) {
      setCurrentTab('entries');
      window.history.replaceState(null, '', '#/entries');
    } else if (!user && (parsed.isUnknownAppRoute || parsed.tab)) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [loadingSession, user]);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('luminary_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('luminary_theme', 'light');
    }
  }, [darkMode]);

  // Sync page title per view
  useEffect(() => {
    if (!user) {
      document.title = 'Luminary — Secure Daily Journal & AI Reflections';
      return;
    }
    const activeTab = NAV_TABS.find((t) => t.id === currentTab);
    document.title = activeTab
      ? `${activeTab.label} — Luminary Daily Journal`
      : 'Luminary Daily Journal';
  }, [user, currentTab]);

  // Session check & auth listener via Supabase Auth
  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error) {
          console.error('Supabase session check failed:', error.message);
        } else if (data.session?.user) {
          setToken(data.session.access_token);
          setUser(mapSupabaseUser(data.session.user));
          await fetchJournals();
        }
      } catch (err) {
        console.error('Session initialization failed', err);
      } finally {
        if (active) setLoadingSession(false);
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setToken(session.access_token);
        setUser(mapSupabaseUser(session.user));
      } else {
        setToken(null);
        setUser(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleSessionExpired() {
    void supabase.auth.signOut();
    setToken(null);
    setUser(null);
    setJournals([]);
    setViewingEntry(null);
    setDeleteTarget(null);
    setAiReflection('');
    setAiReflectionError('');
    reflectionSignatureRef.current = null;
    setSearchQuery('');
    setSelectedMoodFilter('all');
    setSelectedTagFilter('all');
    setFeedback(null);
    resetEditor();
    setCurrentTab('entries');
    setAuthMode('login');
    setAuthNotice('');
    setAuthError('Your session expired. Please sign in again.');
    window.history.replaceState(null, '', '#/login');
  }

  async function fetchJournals() {
    setJournalsLoading(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('id, user_id, title, content, mood, tags, date, created_at')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        setFeedback({
          type: 'error',
          text: formatSupabaseError(error, 'Unable to load journal entries.'),
        });
        return;
      }

      setJournals((data || []).map((row) => mapJournalRow(row as SupabaseJournalRow)));
    } catch (err) {
      setFeedback({
        type: 'error',
        text: formatSupabaseError(err, 'Network error while loading your journal entries.'),
      });
    } finally {
      setJournalsLoading(false);
    }
  }

  function handleChangeAuthMode(mode: AuthMode) {
    setAuthMode(mode);
    setAuthError('');
    setAuthNotice('');
    setRouteHash(`#/${mode}`);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthLoading(true);

    const trimmedEmail = authEmail.trim().toLowerCase();
    const trimmedName = authName.trim();

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (!data.session?.user) {
          throw new Error('Unable to start session. Please verify your email address.');
        }

        const mappedUser = mapSupabaseUser(data.session.user);
        setToken(data.session.access_token);
        setUser(mappedUser);
        setCurrentTab('entries');
        setRouteHash('#/entries');
        setAuthPassword('');
        setAuthError('');
        await fetchJournals();
        setFeedback({
          type: 'success',
          text: `Welcome back, ${mappedUser.name}.`,
        });
      } else {
        if (!trimmedName) {
          throw new Error('Please enter your full name.');
        }
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: authPassword,
          options: {
            data: { name: trimmedName },
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          const mappedUser = mapSupabaseUser(data.session.user);
          setToken(data.session.access_token);
          setUser(mappedUser);
          setCurrentTab('entries');
          setRouteHash('#/entries');
          setAuthPassword('');
          setAuthError('');
          await fetchJournals();
          setFeedback({
            type: 'success',
            text: 'Welcome to Luminary! Your sanctuary is ready.',
          });
        } else {
          setAuthMode('login');
          setAuthPassword('');
          setRouteHash('#/login');
          setAuthNotice(
            'Account created! Please check your email to confirm your address before signing in.'
          );
        }
      }
    } catch (err: unknown) {
      setAuthError(formatSupabaseError(err, 'Authentication failed.'));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    setToken(null);
    setUser(null);
    setJournals([]);
    setViewingEntry(null);
    setDeleteTarget(null);
    setAiReflection('');
    setAiReflectionError('');
    reflectionSignatureRef.current = null;
    setSearchQuery('');
    setSelectedMoodFilter('all');
    setSelectedTagFilter('all');
    setFeedback(null);
    resetEditor();
    setCurrentTab('entries');
    setAuthMode('login');
    setAuthError('');
    setAuthNotice('');
    window.history.replaceState(null, '', window.location.pathname);

    try {
      await supabase.auth.signOut();
    } catch {
      // Session already cleared locally
    }
  }

  async function handleSaveJournal(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!formTitle.trim() || !formContent.trim()) {
      setFeedback({ type: 'error', text: 'Please provide both a title and entry content.' });
      return;
    }

    setEditorLoading(true);
    const tagsArray = Array.from(
      new Set(
        formTagsInput
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0)
      )
    ).slice(0, 10);

    const payload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      mood: formMood,
      tags: tagsArray,
      date: formDate,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('journals')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('journals')
          .insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }

      await fetchJournals();
      setCurrentTab('entries');
      setRouteHash('#/entries');
      setFeedback({
        type: 'success',
        text: editingId ? 'Journal entry updated.' : 'Journal entry saved securely.',
      });
      resetEditor();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: formatSupabaseError(err, 'Failed to save journal entry.'),
      });
    } finally {
      setEditorLoading(false);
    }
  }

  async function confirmDeleteJournal() {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', deleteTarget.id)
        .eq('user_id', user.id);
      if (error) throw error;

      setJournals((prev) => prev.filter((j) => j.id !== deleteTarget.id));
      if (viewingEntry?.id === deleteTarget.id) {
        setViewingEntry(null);
      }
      setDeleteTarget(null);
      setFeedback({ type: 'success', text: 'Journal entry deleted.' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: formatSupabaseError(err, 'Failed to delete journal entry.'),
      });
    } finally {
      setDeleting(false);
    }
  }

  function handleEditClick(entry: JournalEntry) {
    setViewingEntry(null);
    setEditingId(entry.id);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormMood(entry.mood);
    setFormTagsInput(entry.tags.join(', '));
    setFormDate(entry.date);
    setCurrentTab('write');
    setRouteHash('#/write');
  }

  function resetEditor() {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormMood('reflective');
    setFormTagsInput('');
    setFormDate(getLocalDateString());
  }

  async function handleGenerateAIPrompt() {
    if (!token) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mood: formMood }),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'AI prompt generation failed.');
      }
      setFormContent((prev) => (prev ? `${prev}\n\nPrompt: ${data.prompt}\n` : `Prompt: ${data.prompt}\n\n`));
      if (!formTitle) setFormTitle('Reflection Prompt');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not generate AI prompt.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleAISuggest() {
    if (!token || !formContent.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: formContent }),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'AI suggestion failed.');
      }
      if (data.title) setFormTitle(data.title);
      if (Array.isArray(data.tags)) setFormTagsInput(data.tags.join(', '));
      setFeedback({ type: 'success', text: 'Title and tags suggested from your draft.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not generate title and tags.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setAiGenerating(false);
    }
  }

  async function fetchAiReflection(force = false) {
    if (!token) return;
    if (!force && reflectionSignatureRef.current === journalsSignature && aiReflection) {
      return;
    }
    setReflectionLoading(true);
    setAiReflectionError('');
    try {
      const res = await fetch('/api/ai/reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entries: journals.slice(0, 10).map((j) => ({
            date: j.date,
            mood: j.mood,
            title: j.title,
            content: j.content,
          })),
        }),
      });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI reflection.');
      }
      setAiReflection(data.reflection);
      reflectionSignatureRef.current = journalsSignature;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to generate AI reflection right now.';
      setAiReflectionError(message);
    } finally {
      setReflectionLoading(false);
    }
  }

  useEffect(() => {
    if (currentTab === 'insights' && user) {
      fetchAiReflection(false);
    }
  }, [currentTab, user, journalsSignature]);

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#121417]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading your sanctuary...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LandingPage
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        authMode={authMode}
        onChangeAuthMode={handleChangeAuthMode}
        authName={authName}
        onChangeAuthName={setAuthName}
        authEmail={authEmail}
        onChangeAuthEmail={setAuthEmail}
        authPassword={authPassword}
        onChangeAuthPassword={setAuthPassword}
        authError={authError}
        authNotice={authNotice}
        authLoading={authLoading}
        onSubmitAuth={handleAuthSubmit}
      />
    );
  }

  const filteredJournals = journals.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      j.title.toLowerCase().includes(q) ||
      j.content.toLowerCase().includes(q) ||
      j.tags.some((t) => t.toLowerCase().includes(q));
    const matchesMood = selectedMoodFilter === 'all' || j.mood === selectedMoodFilter;
    const matchesTag = selectedTagFilter === 'all' || j.tags.includes(selectedTagFilter);
    return matchesSearch && matchesMood && matchesTag;
  });

  function handleTabSelect(tab: AppTab) {
    if (tab === 'write') {
      resetEditor();
    }
    setCurrentTab(tab);
    setRouteHash(`#/${tab}`);
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedMoodFilter('all');
    setSelectedTagFilter('all');
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedMoodFilter !== 'all' || selectedTagFilter !== 'all';
  const allTags = Array.from(new Set(journals.flatMap((j) => j.tags))).sort();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#121417] text-slate-900 dark:text-slate-100 transition-colors">
      <BrandHeader
        variant="app"
        onBrandClick={() => handleTabSelect('entries')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        centerNav={
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabSelect(tab.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  currentTab === tab.id
                    ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-amber-600'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        }
        rightActions={
          <>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium px-2 py-1">
              <UserIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span className="max-w-[140px] truncate">{user.name}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Logout and return to homepage"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </>
        }
      />

      {/* Mobile Subheader Navigation */}
      <div className="flex md:hidden overflow-x-auto gap-2 px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabSelect(tab.id)}
            className={`px-3.5 py-2 min-h-[40px] rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentTab === tab.id
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.mobileLabel}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 min-w-0">
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-6 px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span className="break-words">{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="p-2 -mr-1 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg hover:opacity-75 shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Suspense
          fallback={
            <div className="py-20 text-center text-xs text-slate-500 dark:text-slate-400">
              Loading view...
            </div>
          }
        >
          {currentTab === 'entries' && (
            <EntriesView
              journals={journals}
              filteredJournals={filteredJournals}
              journalsLoading={journalsLoading}
              searchQuery={searchQuery}
              onChangeSearch={setSearchQuery}
              selectedMoodFilter={selectedMoodFilter}
              onChangeMoodFilter={setSelectedMoodFilter}
              selectedTagFilter={selectedTagFilter}
              onChangeTagFilter={setSelectedTagFilter}
              allTags={allTags}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onNewEntry={() => handleTabSelect('write')}
              onViewEntry={setViewingEntry}
              onEditEntry={handleEditClick}
              onRequestDelete={setDeleteTarget}
            />
          )}

          {currentTab === 'write' && (
            <EntryEditor
              editingId={editingId}
              formTitle={formTitle}
              onChangeTitle={setFormTitle}
              formDate={formDate}
              onChangeDate={setFormDate}
              formMood={formMood}
              onChangeMood={setFormMood}
              formContent={formContent}
              onChangeContent={setFormContent}
              formTagsInput={formTagsInput}
              onChangeTagsInput={setFormTagsInput}
              editorLoading={editorLoading}
              aiGenerating={aiGenerating}
              onGeneratePrompt={handleGenerateAIPrompt}
              onAiSuggest={handleAISuggest}
              onSave={handleSaveJournal}
              onCancel={() => {
                resetEditor();
                handleTabSelect('entries');
              }}
            />
          )}

          {currentTab === 'insights' && (
            <InsightsView
              aiReflection={aiReflection}
              aiReflectionError={aiReflectionError}
              reflectionLoading={reflectionLoading}
              onRefresh={() => fetchAiReflection(true)}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              journals={journals}
              allTags={allTags}
              onSelectTag={(tag) => {
                setSearchQuery('');
                setSelectedMoodFilter('all');
                setSelectedTagFilter(tag);
                handleTabSelect('entries');
              }}
            />
          )}
        </Suspense>
      </main>

      {(viewingEntry || deleteTarget) && (
        <Suspense fallback={null}>
          <EntryModals
            viewingEntry={viewingEntry}
            onCloseViewer={() => setViewingEntry(null)}
            onEditEntry={handleEditClick}
            onRequestDelete={setDeleteTarget}
            deleteTarget={deleteTarget}
            deleting={deleting}
            onCancelDelete={() => setDeleteTarget(null)}
            onConfirmDelete={confirmDeleteJournal}
          />
        </Suspense>
      )}

      <SiteFooter
        text="© 2026 Luminary Daily Journal. Securely stored & protected."
        links={NAV_TABS.map((tab) => ({
          label: tab.label,
          href: `#/${tab.id}`,
          onClick: (e) => {
            e.preventDefault();
            handleTabSelect(tab.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        }))}
      />
    </div>
  );
}
