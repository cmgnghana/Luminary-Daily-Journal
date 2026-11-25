import React from 'react';
import { JournalEntry } from '../types';
import { MOODS } from '../constants/moods';

interface AnalyticsViewProps {
  journals: JournalEntry[];
  allTags: string[];
  onSelectTag: (tag: string) => void;
}

export function AnalyticsView({ journals, allTags, onSelectTag }: AnalyticsViewProps) {
  const totalEntries = journals.length;
  const moodCounts = journals.reduce<Record<string, number>>((acc, j) => {
    acc[j.mood] = (acc[j.mood] || 0) + 1;
    return acc;
  }, {});

  const tagCounts = journals.reduce<Record<string, number>>((acc, j) => {
    for (const tag of j.tags) {
      acc[tag] = (acc[tag] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif-custom font-bold">Mood Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Overview of your emotional landscape and journaling consistency.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Entries</span>
          <p className="text-2xl sm:text-3xl font-bold font-serif-custom mt-2 tabular-nums">{totalEntries}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Unique Tags</span>
          <p className="text-2xl sm:text-3xl font-bold font-serif-custom mt-2 tabular-nums">{allTags.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Latest Entry</span>
          <p className="text-2xl sm:text-3xl font-bold font-serif-custom mt-2 tabular-nums">
            {journals[0]?.date || '—'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
        <h2 className="font-serif-custom font-bold text-lg">Mood Distribution</h2>
        <div className="space-y-4">
          {MOODS.map((m) => {
            const count = moodCounts[m.id] || 0;
            const percentage = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
            const Icon = m.icon;
            return (
              <div key={m.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs font-medium">
                  <span className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 shrink-0 ${m.accent}`} aria-hidden="true" />
                    <span>{m.label}</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                    {count} {count === 1 ? 'entry' : 'entries'} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif-custom font-bold text-lg">Themes &amp; Tags</h2>
          {sortedTags.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Select a tag to view matching entries
            </span>
          )}
        </div>
        {sortedTags.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add comma-separated tags to your journal entries to track recurring themes here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedTags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag(tag)}
                className="inline-flex items-center gap-2 min-h-[40px] max-w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors break-words"
              >
                <span className="break-all">#{tag}</span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
