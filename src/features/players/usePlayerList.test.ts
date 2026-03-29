import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { db } from '../../core/db';
import { usePlayerList } from './usePlayerList';
import type { Player } from '../../core/types';

beforeEach(async () => {
  await db.players.clear();
});

function makePlayer(name: string): Player {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date(),
  };
}

describe('usePlayerList', () => {
  it('should return an empty array when no players exist', async () => {
    const { result } = renderHook(() => usePlayerList());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });

  it('should return all players from the database', async () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    await db.players.bulkAdd([alice, bob]);

    const { result } = renderHook(() => usePlayerList());

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      const names = result.current.map((p) => p.name);
      expect(names).toContain('Alice');
      expect(names).toContain('Bob');
    });
  });

  it('should reactively update when a player is added', async () => {
    const { result } = renderHook(() => usePlayerList());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    const charlie = makePlayer('Charlie');
    await act(async () => {
      await db.players.add(charlie);
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Charlie');
    });
  });

  it('should reactively update when a player is deleted', async () => {
    const alice = makePlayer('Alice');
    await db.players.add(alice);

    const { result } = renderHook(() => usePlayerList());

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });

    await act(async () => {
      await db.players.delete(alice.id);
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(0);
    });
  });

  it('should reactively update when a player name is edited', async () => {
    const alice = makePlayer('Alice');
    await db.players.add(alice);

    const { result } = renderHook(() => usePlayerList());

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Alice');
    });

    await act(async () => {
      await db.players.update(alice.id, { name: 'Alicia' });
    });

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Alicia');
    });
  });
});
