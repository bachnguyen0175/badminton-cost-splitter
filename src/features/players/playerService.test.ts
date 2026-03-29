import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../core/db';
import { playerService } from './playerService';

beforeEach(async () => {
  await db.players.clear();
});

describe('playerService.addPlayer', () => {
  it('should add a player with a valid name', async () => {
    const result = await playerService.addPlayer('Bach');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Bach');
      expect(result.value.id).toBeDefined();
      expect(result.value.createdAt).toBeInstanceOf(Date);
    }

    const players = await db.players.toArray();
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('Bach');
  });

  it('should trim the player name before saving', async () => {
    const result = await playerService.addPlayer('  Bach  ');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Bach');
    }
  });

  it('should reject an empty name', async () => {
    const result = await playerService.addPlayer('');

    expect(result).toEqual({ ok: false, error: 'EMPTY_NAME' });

    const players = await db.players.toArray();
    expect(players).toHaveLength(0);
  });

  it('should reject a whitespace-only name', async () => {
    const result = await playerService.addPlayer('   ');

    expect(result).toEqual({ ok: false, error: 'EMPTY_NAME' });

    const players = await db.players.toArray();
    expect(players).toHaveLength(0);
  });

  it('should reject a duplicate name (case-insensitive)', async () => {
    await playerService.addPlayer('Bach');
    const result = await playerService.addPlayer('bach');

    expect(result).toEqual({ ok: false, error: 'DUPLICATE_NAME' });

    const players = await db.players.toArray();
    expect(players).toHaveLength(1);
  });

  it('should reject a duplicate name with different whitespace', async () => {
    await playerService.addPlayer('Bach');
    const result = await playerService.addPlayer('  Bach  ');

    expect(result).toEqual({ ok: false, error: 'DUPLICATE_NAME' });
  });
});

describe('playerService.updatePlayer', () => {
  it('should update a player name', async () => {
    const addResult = await playerService.addPlayer('Bach');
    if (!addResult.ok) throw new Error('Setup failed');

    const result = await playerService.updatePlayer(addResult.value.id, 'Nam');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Nam');
      expect(result.value.id).toBe(addResult.value.id);
    }

    const player = await db.players.get(addResult.value.id);
    expect(player?.name).toBe('Nam');
  });

  it('should reject an empty name on update', async () => {
    const addResult = await playerService.addPlayer('Bach');
    if (!addResult.ok) throw new Error('Setup failed');

    const result = await playerService.updatePlayer(addResult.value.id, '');

    expect(result).toEqual({ ok: false, error: 'EMPTY_NAME' });

    const player = await db.players.get(addResult.value.id);
    expect(player?.name).toBe('Bach');
  });

  it('should reject a whitespace-only name on update', async () => {
    const addResult = await playerService.addPlayer('Bach');
    if (!addResult.ok) throw new Error('Setup failed');

    const result = await playerService.updatePlayer(addResult.value.id, '   ');

    expect(result).toEqual({ ok: false, error: 'EMPTY_NAME' });
  });

  it('should reject a duplicate name on update (case-insensitive)', async () => {
    await playerService.addPlayer('Bach');
    const addResult = await playerService.addPlayer('Nam');
    if (!addResult.ok) throw new Error('Setup failed');

    const result = await playerService.updatePlayer(addResult.value.id, 'bach');

    expect(result).toEqual({ ok: false, error: 'DUPLICATE_NAME' });

    const player = await db.players.get(addResult.value.id);
    expect(player?.name).toBe('Nam');
  });

  it('should allow updating a player to the same name (case change)', async () => {
    const addResult = await playerService.addPlayer('bach');
    if (!addResult.ok) throw new Error('Setup failed');

    const result = await playerService.updatePlayer(addResult.value.id, 'Bach');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Bach');
    }
  });

  it('should return NOT_FOUND for a non-existent player', async () => {
    const result = await playerService.updatePlayer('non-existent-id', 'Bach');

    expect(result).toEqual({ ok: false, error: 'NOT_FOUND' });
  });
});

describe('playerService.deletePlayer', () => {
  it('should delete an existing player', async () => {
    const addResult = await playerService.addPlayer('Bach');
    if (!addResult.ok) throw new Error('Setup failed');

    const result = await playerService.deletePlayer(addResult.value.id);

    expect(result).toEqual({ ok: true, value: undefined });

    const players = await db.players.toArray();
    expect(players).toHaveLength(0);
  });

  it('should return NOT_FOUND for a non-existent player', async () => {
    const result = await playerService.deletePlayer('non-existent-id');

    expect(result).toEqual({ ok: false, error: 'NOT_FOUND' });
  });
});

describe('playerService.getAllPlayers', () => {
  it('should return an empty array when no players exist', async () => {
    const players = await playerService.getAllPlayers();
    expect(players).toEqual([]);
  });

  it('should return all players', async () => {
    await playerService.addPlayer('Bach');
    await playerService.addPlayer('Nam');
    await playerService.addPlayer('Huy');

    const players = await playerService.getAllPlayers();
    expect(players).toHaveLength(3);

    const names = players.map((p) => p.name);
    expect(names).toContain('Bach');
    expect(names).toContain('Nam');
    expect(names).toContain('Huy');
  });
});
