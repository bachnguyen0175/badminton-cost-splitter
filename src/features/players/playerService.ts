import { db } from '../../core/db';
import type { Player, Result } from '../../core/types';

export interface PlayerService {
  addPlayer(name: string): Promise<Result<Player, 'DUPLICATE_NAME' | 'EMPTY_NAME'>>;
  updatePlayer(id: string, name: string): Promise<Result<Player, 'DUPLICATE_NAME' | 'EMPTY_NAME' | 'NOT_FOUND'>>;
  deletePlayer(id: string): Promise<Result<void, 'NOT_FOUND'>>;
  getAllPlayers(): Promise<Player[]>;
}

async function isDuplicateName(name: string, excludeId?: string): Promise<boolean> {
  const normalized = name.toLowerCase();
  const existing = await db.players
    .filter((p) => p.name.toLowerCase() === normalized && p.id !== excludeId)
    .first();
  return existing !== undefined;
}

function validateName(name: string): Result<string, 'EMPTY_NAME'> {
  const trimmed = name.trim();
  if (trimmed === '') {
    return { ok: false, error: 'EMPTY_NAME' };
  }
  return { ok: true, value: trimmed };
}

export const playerService: PlayerService = {
  async addPlayer(name) {
    const validation = validateName(name);
    if (!validation.ok) return validation;
    const trimmed = validation.value;

    if (await isDuplicateName(trimmed)) {
      return { ok: false, error: 'DUPLICATE_NAME' };
    }

    const player: Player = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date(),
    };

    await db.players.add(player);
    return { ok: true, value: player };
  },

  async updatePlayer(id, name) {
    const validation = validateName(name);
    if (!validation.ok) return validation;
    const trimmed = validation.value;

    const existing = await db.players.get(id);
    if (!existing) {
      return { ok: false, error: 'NOT_FOUND' };
    }

    if (await isDuplicateName(trimmed, id)) {
      return { ok: false, error: 'DUPLICATE_NAME' };
    }

    await db.players.update(id, { name: trimmed });
    return { ok: true, value: { ...existing, name: trimmed } };
  },

  async deletePlayer(id) {
    const existing = await db.players.get(id);
    if (!existing) {
      return { ok: false, error: 'NOT_FOUND' };
    }

    await db.players.delete(id);
    return { ok: true, value: undefined };
  },

  async getAllPlayers() {
    return db.players.toArray();
  },
};
