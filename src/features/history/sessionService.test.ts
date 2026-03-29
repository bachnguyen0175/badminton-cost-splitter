import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../core/db';
import { sessionService } from './sessionService';
import type { SessionRecord } from '../../core/types';

beforeEach(async () => {
  await db.sessions.clear();
});

function makeSessionData(overrides: Partial<Omit<SessionRecord, 'id'>> = {}): Omit<SessionRecord, 'id'> {
  return {
    date: new Date(2026, 2, 28),
    participants: [
      { id: 'p1', name: 'Bách' },
      { id: 'p2', name: 'Nam' },
      { id: 'p3', name: 'Huy' },
    ],
    costItems: [
      { label: 'Sân', amount: 300000 },
      { label: 'Cầu', amount: 80000 },
    ],
    totalCost: 380000,
    payers: [{ playerId: 'p1', playerName: 'Bách', amount: 380000 }],
    transfers: [
      {
        fromPlayerId: 'p2',
        fromPlayerName: 'Nam',
        toPlayerId: 'p1',
        toPlayerName: 'Bách',
        exactAmount: 126667,
        roundedAmount: 127000,
      },
      {
        fromPlayerId: 'p3',
        fromPlayerName: 'Huy',
        toPlayerId: 'p1',
        toPlayerName: 'Bách',
        exactAmount: 126667,
        roundedAmount: 127000,
      },
    ],
    note: 'Sân Tân Bình',
    ...overrides,
  };
}

describe('sessionService.saveSession', () => {
  it('should save a session and return an ID', async () => {
    const id = await sessionService.saveSession(makeSessionData());

    expect(id).toBeDefined();
    expect(typeof id).toBe('string');

    const stored = await db.sessions.get(id);
    expect(stored).toBeDefined();
    expect(stored!.totalCost).toBe(380000);
    expect(stored!.participants).toHaveLength(3);
    expect(stored!.note).toBe('Sân Tân Bình');
  });

  it('should save a session with null note', async () => {
    const id = await sessionService.saveSession(makeSessionData({ note: null }));

    const stored = await db.sessions.get(id);
    expect(stored!.note).toBeNull();
  });

  it('should generate unique IDs for each session', async () => {
    const id1 = await sessionService.saveSession(makeSessionData());
    const id2 = await sessionService.saveSession(makeSessionData());

    expect(id1).not.toBe(id2);
  });
});

describe('sessionService.getAllSessions', () => {
  it('should return an empty array when no sessions exist', async () => {
    const sessions = await sessionService.getAllSessions();
    expect(sessions).toEqual([]);
  });

  it('should return all sessions sorted by date descending (newest first)', async () => {
    await sessionService.saveSession(makeSessionData({ date: new Date(2026, 0, 1) }));
    await sessionService.saveSession(makeSessionData({ date: new Date(2026, 2, 28) }));
    await sessionService.saveSession(makeSessionData({ date: new Date(2026, 1, 15) }));

    const sessions = await sessionService.getAllSessions();
    expect(sessions).toHaveLength(3);
    expect(sessions[0].date.getTime()).toBeGreaterThanOrEqual(sessions[1].date.getTime());
    expect(sessions[1].date.getTime()).toBeGreaterThanOrEqual(sessions[2].date.getTime());
  });
});

describe('sessionService.getSession', () => {
  it('should retrieve a session by ID', async () => {
    const id = await sessionService.saveSession(makeSessionData());

    const session = await sessionService.getSession(id);

    expect(session).toBeDefined();
    expect(session!.id).toBe(id);
    expect(session!.totalCost).toBe(380000);
    expect(session!.transfers).toHaveLength(2);
  });

  it('should return null for a non-existent ID', async () => {
    const session = await sessionService.getSession('non-existent-id');
    expect(session).toBeNull();
  });
});

describe('sessionService.deleteSession', () => {
  it('should delete a session by ID', async () => {
    const id = await sessionService.saveSession(makeSessionData());

    await sessionService.deleteSession(id);

    const session = await db.sessions.get(id);
    expect(session).toBeUndefined();
  });

  it('should not throw when deleting a non-existent session', async () => {
    await expect(sessionService.deleteSession('non-existent-id')).resolves.not.toThrow();
  });
});
