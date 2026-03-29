import { describe, it, expect } from 'vitest';
import { db } from '../core/db';
import type { Player, SessionRecord, CostItem, PayerEntry, Transfer, Result } from '../core/types';

describe('AppDatabase schema', () => {
  it('has a players table', () => {
    expect(db.players).toBeDefined();
  });

  it('has a sessions table', () => {
    expect(db.sessions).toBeDefined();
  });

  it('uses version 1 schema', () => {
    expect(db.verno).toBe(1);
  });
});

describe('Shared types', () => {
  it('Player type has correct shape', () => {
    const player: Player = { id: 'abc', name: 'Test', createdAt: new Date() };
    expect(player.id).toBe('abc');
    expect(player.name).toBe('Test');
    expect(player.createdAt).toBeInstanceOf(Date);
  });

  it('CostItem type has correct shape', () => {
    const item: CostItem = { id: '1', label: 'Court', amount: 300000 };
    expect(item.label).toBe('Court');
    expect(item.amount).toBe(300000);
  });

  it('PayerEntry type has correct shape', () => {
    const entry: PayerEntry = { playerId: 'p1', amount: 500000 };
    expect(entry.playerId).toBe('p1');
    expect(entry.amount).toBe(500000);
  });

  it('Transfer type has correct shape', () => {
    const transfer: Transfer = {
      fromPlayerId: 'p1',
      fromPlayerName: 'Nam',
      toPlayerId: 'p2',
      toPlayerName: 'Bach',
      exactAmount: 66666,
      roundedAmount: 67000,
    };
    expect(transfer.fromPlayerName).toBe('Nam');
    expect(transfer.roundedAmount).toBe(67000);
  });

  it('SessionRecord type has correct shape', () => {
    const session: SessionRecord = {
      id: 's1',
      date: new Date(),
      participants: [{ id: 'p1', name: 'Nam' }],
      costItems: [{ label: 'Court', amount: 300000 }],
      totalCost: 300000,
      payers: [{ playerId: 'p1', playerName: 'Nam', amount: 300000 }],
      transfers: [],
      note: null,
    };
    expect(session.totalCost).toBe(300000);
    expect(session.note).toBeNull();
  });

  it('Result discriminated union works for success', () => {
    const success: Result<string, 'ERROR'> = { ok: true, value: 'hello' };
    expect(success.ok).toBe(true);
    if (success.ok) {
      expect(success.value).toBe('hello');
    }
  });

  it('Result discriminated union works for failure', () => {
    const failure: Result<string, 'DUPLICATE_NAME' | 'EMPTY_NAME'> = {
      ok: false,
      error: 'DUPLICATE_NAME',
    };
    expect(failure.ok).toBe(false);
    if (!failure.ok) {
      expect(failure.error).toBe('DUPLICATE_NAME');
    }
  });
});
