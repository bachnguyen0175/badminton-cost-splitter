import { db } from '../../core/db';
import type { SessionRecord } from '../../core/types';

export interface SessionService {
  saveSession(session: Omit<SessionRecord, 'id'>): Promise<string>;
  getAllSessions(): Promise<SessionRecord[]>;
  getSession(id: string): Promise<SessionRecord | null>;
  deleteSession(id: string): Promise<void>;
}

export const sessionService: SessionService = {
  async saveSession(session) {
    const id = crypto.randomUUID();
    const record: SessionRecord = { id, ...session };
    await db.sessions.add(record);
    return id;
  },

  async getAllSessions() {
    return db.sessions.orderBy('date').reverse().toArray();
  },

  async getSession(id) {
    const session = await db.sessions.get(id);
    return session ?? null;
  },

  async deleteSession(id) {
    await db.sessions.delete(id);
  },
};
