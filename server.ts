import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

// Initialize Google GenAI SDK server-side lazily
function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Database setup (JSON file persistence)
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  date: string;
  createdAt: string;
}

interface DB {
  users: User[];
  journals: JournalEntry[];
  sessions: { token: string; userId: string; expiresAt: string }[];
}

function ensureDB(): DB {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: DB = { users: [], journals: [], sessions: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      journals: Array.isArray(parsed.journals) ? parsed.journals : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch (err) {
    console.error('Failed to parse database file, initializing empty state:', err);
    return { users: [], journals: [], sessions: [] };
  }
}

function saveDB(db: DB) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2));
  fs.renameSync(tempFile, DB_FILE);
}

function getLocalDateString(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    const derived = crypto.scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(key, 'hex');
    if (derived.length !== keyBuf.length) return false;
    return crypto.timingSafeEqual(derived, keyBuf);
  }
  // Legacy fallback compatibility
  const legacy = crypto.createHash('sha256').update(password + 'luminary_salt_2026').digest('hex');
  return legacy === storedHash;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const ALLOWED_MOODS = new Set(['joyful', 'reflective', 'peaceful', 'energetic', 'grateful', 'anxious']);

function normalizeTags(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) return [];
  const cleaned = rawTags
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  return Array.from(new Set(cleaned)).slice(0, 10);
}

interface JournalPayloadDefaults {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  date?: string;
}

function validateJournalPayload(body: Record<string, unknown> | undefined, defaults?: JournalPayloadDefaults) {
  const title = typeof body?.title === 'string' ? body.title.trim() : (defaults?.title ?? '');
  const content = typeof body?.content === 'string' ? body.content.trim() : (defaults?.content ?? '');
  const moodRaw = typeof body?.mood === 'string' ? body.mood.trim() : (defaults?.mood ?? 'reflective');
  const mood = ALLOWED_MOODS.has(moodRaw) ? moodRaw : (defaults?.mood ?? 'reflective');
  const tags = body?.tags !== undefined ? normalizeTags(body.tags) : (defaults?.tags ?? []);
  const date =
    typeof body?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : (defaults?.date ?? getLocalDateString());

  return { title, content, mood, tags, date };
}

// Auth Middleware (supports Supabase Auth JWTs and local server sessions)
async function authenticateUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      });
      if (verifyRes.ok) {
        const supaUser = (await verifyRes.json()) as {
          id?: string;
          email?: string;
          created_at?: string;
          user_metadata?: { name?: string };
        };
        if (supaUser?.id && supaUser?.email) {
          return {
            id: supaUser.id,
            name: supaUser.user_metadata?.name || supaUser.email.split('@')[0],
            email: supaUser.email,
            passwordHash: '',
            createdAt: supaUser.created_at || new Date().toISOString(),
          };
        }
      }
    } catch {
      // Fall through to local session check if network verification fails
    }
  }

  const db = ensureDB();
  const now = new Date();
  const session = db.sessions.find((s) => s.token === token && new Date(s.expiresAt) > now);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user || null;
}

function sortJournalsDesc(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

async function startServer() {
  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Signup
  app.post('/api/auth/signup', (req: Request, res: Response) => {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const db = ensureDB();
      const existing = db.users.find((u) => u.email.toLowerCase() === email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      db.sessions.push({ token, userId: newUser.id, expiresAt });

      saveDB(db);

      return res.status(201).json({
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error during signup.' });
    }
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const db = ensureDB();
      const user = db.users.find((u) => u.email.toLowerCase() === email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      // Prune expired sessions opportunistically
      const now = new Date();
      db.sessions = db.sessions.filter((s) => new Date(s.expiresAt) > now);
      db.sessions.push({ token, userId: user.id, expiresAt });

      saveDB(db);

      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error during login.' });
    }
  });

  // Get current session user
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    return res.json({ user: { id: user.id, name: user.name, email: user.email } });
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const db = ensureDB();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDB(db);
    }
    return res.json({ success: true });
  });

  // Journals CRUD
  app.get('/api/journals', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const db = ensureDB();
    const userJournals = sortJournalsDesc(db.journals.filter((j) => j.userId === user.id));
    return res.json(userJournals);
  });

  app.post('/api/journals', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { title, content, mood, tags, date } = validateJournalPayload(req.body);

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const db = ensureDB();
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      content,
      mood,
      tags,
      date,
      createdAt: new Date().toISOString(),
    };

    db.journals.push(newEntry);
    saveDB(db);

    return res.status(201).json(newEntry);
  });

  app.put('/api/journals/:id', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { id } = req.params;
    const db = ensureDB();
    const index = db.journals.findIndex((j) => j.id === id && j.userId === user.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    const existing = db.journals[index];
    const { title, content, mood, tags, date } = validateJournalPayload(req.body, existing);

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content cannot be empty.' });
    }

    const updated: JournalEntry = {
      ...existing,
      title,
      content,
      mood,
      tags,
      date,
    };

    db.journals[index] = updated;
    saveDB(db);

    return res.json(updated);
  });

  app.delete('/api/journals/:id', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const { id } = req.params;
    const db = ensureDB();
    const initialCount = db.journals.length;
    db.journals = db.journals.filter((j) => !(j.id === id && j.userId === user.id));

    if (db.journals.length === initialCount) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }

    saveDB(db);
    return res.json({ success: true });
  });

  // AI Routes
  app.post('/api/ai/prompt', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    try {
      const { mood } = req.body || {};
      const response = await getAI().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate a thoughtful, inspiring daily journal prompt for someone whose current mood is "${mood || 'reflective'}". Return only the prompt sentence in plain text without quotes or preamble.`,
      });
      return res.json({
        prompt: response.text?.trim() || 'What brought you a sense of calm or clarity today?',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'AI prompt generation failed.' });
    }
  });

  app.post('/api/ai/reflection', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    try {
      const rawEntries: unknown[] | null = Array.isArray(req.body?.entries) ? req.body.entries : null;
      const clientJournals: Array<{ date: string; mood: string; title: string; content: string }> | null = rawEntries
        ? rawEntries
            .filter((item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
            .slice(0, 10)
            .map((item) => ({
              date: typeof item.date === 'string' ? item.date : getLocalDateString(),
              mood: typeof item.mood === 'string' ? item.mood : 'reflective',
              title: typeof item.title === 'string' ? item.title : 'Untitled',
              content: typeof item.content === 'string' ? item.content : '',
            }))
            .filter((item) => item.content.trim().length > 0)
        : null;

      const userJournals =
        clientJournals !== null
          ? clientJournals
          : sortJournalsDesc(ensureDB().journals.filter((j) => j.userId === user.id)).slice(0, 10);

      if (userJournals.length === 0) {
        return res.json({
          reflection: 'Write a few journal entries to unlock personalized AI reflections and emotional insights.',
        });
      }

      const journalSummary = userJournals
        .map(
          (j: { date: string; mood: string; title: string; content: string }) =>
            `Date: ${j.date}, Mood: ${j.mood}, Title: ${j.title}, Content: ${j.content.substring(0, 300)}`
        )
        .join('\n\n');

      const response = await getAI().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `You are a compassionate mindfulness and psychological journaling coach. Analyze these recent journal entries and provide a warm, insightful reflection (around 150-200 words), highlighting emotional patterns, positive growth, and gentle encouragement.\n\nEntries:\n${journalSummary}`,
      });

      return res.json({
        reflection: response.text?.trim() || 'You are making wonderful progress on your self-discovery journey.',
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'AI reflection generation failed.' });
    }
  });

  app.post('/api/ai/suggest', async (req: Request, res: Response) => {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    try {
      const { content } = req.body || {};
      if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Write some journal content first to generate suggestions.' });
      }

      const response = await getAI().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Based on this journal draft, suggest a poetic or descriptive title (max 6 words) and 3 relevant tags (lowercase single words). Return JSON with keys "title" (string) and "tags" (array of strings).\n\nDraft:\n${content.substring(0, 600)}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Daily Reflection',
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((t: unknown): t is string => typeof t === 'string').slice(0, 5)
          : ['reflection'],
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'AI suggestion generation failed.' });
    }
  });

  // Catch-all 404 for unknown API routes so they never fall through to SPA HTML
  app.all('/api/*', (_req: Request, res: Response) => {
    return res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite dev server middleware
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Luminary Journal server running on http://localhost:${port}`);
  });
}

startServer();
