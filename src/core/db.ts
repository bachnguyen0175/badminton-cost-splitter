import Dexie, { type Table } from 'dexie';
import type { Player, SessionRecord } from './types';

export class AppDatabase extends Dexie {
  players!: Table<Player, string>;
  sessions!: Table<SessionRecord, string>;

  constructor() {
    super('BadmintonCostSplitterDB');
    this.version(1).stores({
      players: 'id, &name',
      sessions: 'id, date',
    });
  }
}

export const db = new AppDatabase();
