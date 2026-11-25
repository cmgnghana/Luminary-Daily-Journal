import React from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface InsightsViewProps {
  aiReflection: string;
  aiReflectionError: string;
  reflectionLoading: boolean;
  onRefresh: () => void;
}

export function InsightsView({
  aiReflection,
  aiReflectionError,
  reflectionLoading,
  onRefresh,
}: InsightsViewProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif-custom font-bold">AI Emotional Reflections</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Compassionate AI coaching based on your recent journal entries.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-2xl shrink-0">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif-custom font-bold text-lg">Luminary AI Coach</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthesizing insights from your latest entries
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={reflectionLoading}
            className="px-4 py-2 min-h-[40px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reflectionLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh Insight</span>
          </button>
        </div>

        {reflectionLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Reflecting on your journey...</p>
          </div>
        ) : aiReflectionError ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="break-words">{aiReflectionError}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-5 sm:p-6 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl">
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-serif-custom text-lg italic whitespace-pre-wrap break-words">
                {aiReflection || 'Write more journal entries to unlock your first AI reflection.'}
              </p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              AI reflections are generated privately to support your personal reflection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
