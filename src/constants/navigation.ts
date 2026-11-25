import { AppTab } from '../types';

export interface NavTabItem {
  id: AppTab;
  label: string;
  mobileLabel: string;
}

export const NAV_TABS: NavTabItem[] = [
  { id: 'entries', label: 'My Entries', mobileLabel: 'My Entries' },
  { id: 'write', label: 'New Entry', mobileLabel: 'New Entry' },
  { id: 'insights', label: 'AI Reflections', mobileLabel: 'AI Reflections' },
  { id: 'analytics', label: 'Mood Analytics', mobileLabel: 'Mood Analytics' },
];
