import os from 'os';
import type { Note } from '../../types';

interface SyncSession {
  notes: Map<string, Note>;
  expiresAt: number;
  createdAt: number;
}

// Module-level store — persists across requests in same process
const sessions = new Map<string, SyncSession>();

export const shareService = {
  purgeExpired() {
    const now = Date.now();
    for (const [token, s] of sessions) {
      if (s.expiresAt < now) sessions.delete(token);
    }
  },

  getLocalIP(): string {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] ?? []) {
        if (net.family === 'IPv4' && !net.internal) return net.address;
      }
    }
    return 'localhost';
  },

  sessionToResponse(token: string, session: SyncSession) {
    return {
      token,
      notes: Array.from(session.notes.values()),
      count: session.notes.size,
      expiresAt: session.expiresAt,
    };
  },

  createSession(notes: Note[], port: string) {
    this.purgeExpired();

    if (!Array.isArray(notes)) {
      throw new Error('Invalid payload');
    }

    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const noteMap = new Map<string, Note>();
    for (const n of notes) {
      if (n.id) noteMap.set(n.id, n);
    }

    sessions.set(token, { notes: noteMap, expiresAt, createdAt: Date.now() });

    const ip = this.getLocalIP();
    const url = `http://${ip}:${port}/private?share=${token}`;

    return { token, url, expiresAt, ...this.sessionToResponse(token, sessions.get(token)!) };
  },

  getSession(token: string) {
    this.purgeExpired();

    const session = sessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(token);
      throw new Error('Session expired or not found');
    }

    return this.sessionToResponse(token, session);
  },

  mergeSession(token: string, notes: Note[]) {
    this.purgeExpired();

    const session = sessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(token);
      throw new Error('Session expired or not found');
    }

    let added = 0;
    for (const n of notes) {
      if (n.id) {
        if (!session.notes.has(n.id)) added++;
        session.notes.set(n.id, n);
      }
    }

    return { ...this.sessionToResponse(token, session), added };
  }
};
