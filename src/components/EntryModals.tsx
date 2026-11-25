import React, { useEffect } from 'react';
import { X, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalEntry } from '../types';
import { MOODS } from '../constants/moods';

interface EntryModalsProps {
  viewingEntry: JournalEntry | null;
  onCloseViewer: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onRequestDelete: (entry: JournalEntry) => void;
  deleteTarget: JournalEntry | null;
  deleting: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

export function EntryModals({
  viewingEntry,
  onCloseViewer,
  onEditEntry,
  onRequestDelete,
  deleteTarget,
  deleting,
  onCancelDelete,
  onConfirmDelete,
}: EntryModalsProps) {
  const isModalOpen = Boolean(viewingEntry || deleteTarget);

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (deleteTarget) {
        if (!deleting) onCancelDelete();
      } else if (viewingEntry) {
        onCloseViewer();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, deleteTarget, deleting, viewingEntry, onCancelDelete, onCloseViewer]);

  return (
    <>
      {/* Entry Reader Modal */}
      <AnimatePresence>
        {viewingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseViewer}
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reader-modal-title"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 sm:p-8 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{MOODS.find((m) => m.id === viewingEntry.mood)?.label || 'Reflective'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{viewingEntry.date}</span>
                  </div>
                  <h2 id="reader-modal-title" className="text-2xl sm:text-3xl font-serif-custom font-bold break-words">
                    {viewingEntry.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onCloseViewer}
                  className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg shrink-0"
                  aria-label="Close reader"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words border-y border-slate-100 dark:border-slate-800 py-5">
                {viewingEntry.content}
              </div>

              {viewingEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {viewingEntry.tags.map((t) => (
                    <span key={t} className="break-words">#{t}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onRequestDelete(viewingEntry)}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditEntry(viewingEntry)}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-slate-900 dark:bg-amber-600 hover:opacity-90 rounded-xl transition-opacity flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Edit Entry</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && onCancelDelete()}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4"
            >
              <h3 id="delete-modal-title" className="text-xl font-serif-custom font-bold">
                Delete Journal Entry
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 dark:text-slate-100">{deleteTarget.title}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={onCancelDelete}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={onConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete Entry'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
