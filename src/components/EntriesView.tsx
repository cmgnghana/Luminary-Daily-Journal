import React from 'react';
import { BookOpen, Plus, Search, Calendar, Edit3, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { JournalEntry } from '../types';
import { MOODS } from '../constants/moods';

interface EntriesViewProps {
  journals: JournalEntry[];
  filteredJournals: JournalEntry[];
  journalsLoading: boolean;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  selectedMoodFilter: string;
  onChangeMoodFilter: (value: string) => void;
  selectedTagFilter: string;
  onChangeTagFilter: (value: string) => void;
  allTags: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onNewEntry: () => void;
  onViewEntry: (entry: JournalEntry) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onRequestDelete: (entry: JournalEntry) => void;
}

export function EntriesView({
  journals,
  filteredJournals,
  journalsLoading,
  searchQuery,
  onChangeSearch,
  selectedMoodFilter,
  onChangeMoodFilter,
  selectedTagFilter,
  onChangeTagFilter,
  allTags,
  hasActiveFilters,
  onClearFilters,
  onNewEntry,
  onViewEntry,
  onEditEntry,
  onRequestDelete,
}: EntriesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif-custom font-bold">Your Journal Entries</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {journals.length} {journals.length === 1 ? 'reflection' : 'reflections'} securely stored.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewEntry}
          className="px-4 py-2.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      {journals.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-3 w-4 h-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="Search entries or tags..."
              className="w-full min-h-[40px] pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <select
              aria-label="Filter by mood"
              value={selectedMoodFilter}
              onChange={(e) => onChangeMoodFilter(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 min-h-[40px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Moods</option>
              {MOODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by tag"
              value={selectedTagFilter}
              onChange={(e) => onChangeTagFilter(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 min-h-[40px] px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="px-3 py-2 min-h-[40px] text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Entries Grid */}
      {journalsLoading ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 text-xs">Loading entries...</div>
      ) : filteredJournals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700" aria-hidden="true" />
          <h2 className="text-lg font-serif-custom font-bold">
            {hasActiveFilters ? 'No matching entries' : 'No entries yet'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            {hasActiveFilters
              ? 'Try adjusting your search or filter selections.'
              : 'Begin writing your daily thoughts and reflections to build your mindfulness sanctuary.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-2 px-4 py-2 bg-slate-900 dark:bg-amber-600 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewEntry}
              className="mt-2 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-500 transition-colors"
            >
              Write First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJournals.map((entry) => {
            const moodObj = MOODS.find((m) => m.id === entry.mood) || MOODS[1];
            const MoodIcon = moodObj.icon;
            return (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-w-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
              >
                <button
                  type="button"
                  onClick={() => onViewEntry(entry)}
                  className="w-full text-left space-y-3 cursor-pointer min-w-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${moodObj.accent}`}>
                      <MoodIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{moodObj.label}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums shrink-0">
                      <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{entry.date}</span>
                    </span>
                  </div>

                  <h2 className="text-xl font-serif-custom font-bold text-slate-900 dark:text-slate-100 line-clamp-1 break-words">
                    {entry.title}
                  </h2>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap break-words leading-relaxed">
                    {entry.content}
                  </p>
                </button>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 min-w-0">
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {entry.tags.map((t) => (
                        <span key={t} className="break-words">#{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onViewEntry(entry)}
                      className="py-2 pr-2 min-h-[40px] text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center"
                    >
                      Read entry
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="p-2.5 min-w-[40px] min-h-[40px] inline-flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label={`Edit ${entry.title}`}
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDelete(entry)}
                        className="p-2.5 min-w-[40px] min-h-[40px] inline-flex items-center justify-center text-rose-600 dark:text-rose-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        aria-label={`Delete ${entry.title}`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
