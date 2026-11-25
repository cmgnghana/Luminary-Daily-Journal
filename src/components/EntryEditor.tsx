import React from 'react';
import { Sparkles } from 'lucide-react';
import { MOODS } from '../constants/moods';

interface EntryEditorProps {
  editingId: string | null;
  formTitle: string;
  onChangeTitle: (value: string) => void;
  formDate: string;
  onChangeDate: (value: string) => void;
  formMood: string;
  onChangeMood: (value: string) => void;
  formContent: string;
  onChangeContent: (value: string) => void;
  formTagsInput: string;
  onChangeTagsInput: (value: string) => void;
  editorLoading: boolean;
  aiGenerating: boolean;
  onGeneratePrompt: () => void;
  onAiSuggest: () => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function EntryEditor({
  editingId,
  formTitle,
  onChangeTitle,
  formDate,
  onChangeDate,
  formMood,
  onChangeMood,
  formContent,
  onChangeContent,
  formTagsInput,
  onChangeTagsInput,
  editorLoading,
  aiGenerating,
  onGeneratePrompt,
  onAiSuggest,
  onSave,
  onCancel,
}: EntryEditorProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif-custom font-bold">
            {editingId ? 'Edit Journal Entry' : 'Daily Reflection'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Express your thoughts freely in your secure digital sanctuary.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline"
        >
          Cancel
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-sm">
        <form onSubmit={onSave} className="space-y-6">
          {/* Mood Selector */}
          <div>
            <span id="mood-selector-label" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              How are you feeling today?
            </span>
            <div role="group" aria-labelledby="mood-selector-label" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {MOODS.map((m) => {
                const Icon = m.icon;
                const isSelected = formMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onChangeMood(m.id)}
                    className={`flex items-center justify-center sm:justify-start gap-2 p-3 min-h-[44px] rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="entry-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                id="entry-title"
                type="text"
                required
                value={formTitle}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="e.g. Morning Calm & Clarity"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label htmlFor="entry-date" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                id="entry-date"
                type="date"
                required
                value={formDate}
                onChange={(e) => onChangeDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label htmlFor="entry-content" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Content
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onGeneratePrompt}
                  disabled={aiGenerating}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-950/50 text-xs font-semibold text-amber-800 dark:text-amber-300 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{aiGenerating ? 'Thinking...' : 'AI Prompt'}</span>
                </button>
                <button
                  type="button"
                  onClick={onAiSuggest}
                  disabled={aiGenerating || !formContent.trim()}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-950/50 text-xs font-semibold text-amber-800 dark:text-amber-300 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>AI Auto-Title &amp; Tags</span>
                </button>
              </div>
            </div>
            <textarea
              id="entry-content"
              required
              rows={9}
              value={formContent}
              onChange={(e) => onChangeContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="entry-tags" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="entry-tags"
              type="text"
              value={formTagsInput}
              onChange={(e) => onChangeTagsInput(e.target.value)}
              placeholder="mindfulness, work, growth, gratitude"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editorLoading}
              className="px-6 py-2.5 bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              {editorLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{editingId ? 'Update Entry' : 'Save Entry'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
