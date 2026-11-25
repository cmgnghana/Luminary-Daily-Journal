import { Smile, Compass, Sun, Zap, Heart, Frown, LucideIcon } from 'lucide-react';

export interface MoodOption {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: string;
}

export const MOODS: MoodOption[] = [
  { id: 'joyful', label: 'Joyful', icon: Smile, accent: 'text-amber-600 dark:text-amber-400' },
  { id: 'reflective', label: 'Reflective', icon: Compass, accent: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'peaceful', label: 'Peaceful', icon: Sun, accent: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'energetic', label: 'Energetic', icon: Zap, accent: 'text-orange-600 dark:text-orange-400' },
  { id: 'grateful', label: 'Grateful', icon: Heart, accent: 'text-rose-600 dark:text-rose-400' },
  { id: 'anxious', label: 'Anxious', icon: Frown, accent: 'text-slate-600 dark:text-slate-400' },
];
