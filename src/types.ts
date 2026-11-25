export interface User {
  id: string;
  name: string;
  email: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  date: string;
  createdAt: string;
}

export interface FeedbackMessage {
  type: 'success' | 'error';
  text: string;
}

export type AppTab = 'entries' | 'write' | 'insights' | 'analytics';
export type AuthMode = 'login' | 'signup';
