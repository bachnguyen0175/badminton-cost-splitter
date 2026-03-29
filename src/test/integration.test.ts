import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../core/db';
import { playerService } from '../features/players/playerService';
import { sessionService } from '../features/history/sessionService';
import { calculateSettlement } from '../core/settlementEngine';
import { copySettlementSummary, formatSettlementText } from '../core/clipboardService';
import { useSessionForm } from '../features/session/useSessionForm';
import { useSessionDerived } from '../features/session/useSessionDerived';
import type { Player } from '../core/types';

beforeEach(async () => {
  await db.players.clear();
  await db.sessions.clear();
});

describe('Integration: Full Session Flow', () => {
  it('select players → enter costs → select payer → verify settlement → copy → verify persistence', async () => {
    // Step 1: Add players to database
    const addResult1 = await playerService.addPlayer('Bách');
    const addResult2 = await playerService.addPlayer('Nam');
    const addResult3 = await playerService.addPlayer('Huy');
    expect(addResult1.ok).toBe(true);
    expect(addResult2.ok).toBe(true);
    expect(addResult3.ok).toBe(true);

    const players = await playerService.getAllPlayers();
    expect(players).toHaveLength(3);

    // Step 2: Use session form hook to build a session
    const { result } = renderHook(() => {
      const form = useSessionForm(players);
      const derived = useSessionDerived(form.state,
        players.filter(p => form.state.selectedPlayerIds.has(p.id))
          .map(p => ({ id: p.id, name: p.name }))
      );
      return { form, derived };
    });

    // Step 3: Select all players
    for (const player of players) {
      act(() => result.current.form.actions.togglePlayer(player.id));
    }
    expect(result.current.form.state.selectedPlayerIds.size).toBe(3);

    // Step 4: Enter cost items
    const costItemId = result.current.form.state.costItems[0].id;
    act(() => {
      result.current.form.actions.updateCostItem(costItemId, 'label', 'Sân');
      result.current.form.actions.updateCostItem(costItemId, 'amount', 300000);
    });

    // Add another cost item
    act(() => result.current.form.actions.addCostItem());
    const secondCostId = result.current.form.state.costItems[1].id;
    act(() => {
      result.current.form.actions.updateCostItem(secondCostId, 'label', 'Cầu');
      result.current.form.actions.updateCostItem(secondCostId, 'amount', 80000);
    });

    // Verify total cost
    expect(result.current.derived.totalCost).toBe(380000);

    // Step 5: Select payer (single payer - Bách pays all)
    const bach = players.find(p => p.name === 'Bách')!;
    act(() => result.current.form.actions.togglePayer(bach.id));

    // Single payer should auto-fill with total cost
    expect(result.current.form.state.payerEntries).toHaveLength(1);
    expect(result.current.form.state.payerEntries[0].amount).toBe(380000);
    expect(result.current.derived.isPayerAmountValid).toBe(true);

    // Step 6: Verify settlement
    expect(result.current.derived.hasValidSettlement).toBe(true);
    const settlement = result.current.derived.settlementResult;
    expect(settlement).not.toBeNull();
    expect(settlement!.isSoloSession).toBe(false);
    expect(settlement!.transfers.length).toBeGreaterThan(0);

    // Each non-payer should owe their fair share (~126,667 VND)
    for (const transfer of settlement!.transfers) {
      expect(transfer.toPlayerId).toBe(bach.id);
      expect(transfer.exactAmount).toBeCloseTo(380000 / 3, 0);
    }

    // Step 7: Persist session to IndexedDB
    const participants = players.map(p => ({ id: p.id, name: p.name }));
    const costItems = result.current.form.state.costItems
      .filter(c => c.amount !== null && c.amount > 0)
      .map(c => ({ label: c.label, amount: c.amount! }));

    const sessionId = await sessionService.saveSession({
      date: new Date(2026, 2, 28),
      participants,
      costItems,
      totalCost: result.current.derived.totalCost,
      payers: [{ playerId: bach.id, playerName: bach.name, amount: 380000 }],
      transfers: settlement!.transfers,
      note: null,
    });

    act(() => result.current.form.actions.markPersisted());
    expect(result.current.form.state.isPersisted).toBe(true);

    // Step 8: Verify persistence in IndexedDB
    const savedSession = await sessionService.getSession(sessionId);
    expect(savedSession).not.toBeNull();
    expect(savedSession!.totalCost).toBe(380000);
    expect(savedSession!.participants).toHaveLength(3);
    expect(savedSession!.costItems).toHaveLength(2);
    expect(savedSession!.payers).toHaveLength(1);
    expect(savedSession!.payers[0].playerName).toBe('Bách');
    expect(savedSession!.transfers.length).toBeGreaterThan(0);

    // Step 9: Verify formatted text generation (clipboard)
    const text = formatSettlementText(
      settlement!.transfers,
      380000,
      costItems,
      participants,
      null,
      new Date(2026, 2, 28)
    );
    expect(text).toContain('Cầu lông');
    expect(text).toContain('380');
    expect(text).toContain('Bách');
    expect(text).toContain('Kết quả');
  });

  it('handles multi-payer session with matching amounts', async () => {
    const r1 = await playerService.addPlayer('A');
    const r2 = await playerService.addPlayer('B');
    const r3 = await playerService.addPlayer('C');
    expect(r1.ok && r2.ok && r3.ok).toBe(true);

    const players = await playerService.getAllPlayers();

    const { result } = renderHook(() => {
      const form = useSessionForm(players);
      const derived = useSessionDerived(form.state,
        players.filter(p => form.state.selectedPlayerIds.has(p.id))
          .map(p => ({ id: p.id, name: p.name }))
      );
      return { form, derived };
    });

    // Select all
    for (const p of players) {
      act(() => result.current.form.actions.togglePlayer(p.id));
    }

    // Enter cost
    const costId = result.current.form.state.costItems[0].id;
    act(() => result.current.form.actions.updateCostItem(costId, 'amount', 300000));

    // Select two payers (A and B)
    const playerA = players.find(p => p.name === 'A')!;
    const playerB = players.find(p => p.name === 'B')!;

    act(() => result.current.form.actions.togglePayer(playerA.id));
    // First payer auto-fills with total
    expect(result.current.form.state.payerEntries[0].amount).toBe(300000);

    act(() => result.current.form.actions.togglePayer(playerB.id));
    // Multi-payer: amounts should be cleared
    expect(result.current.form.state.payerEntries[0].amount).toBeNull();
    expect(result.current.form.state.payerEntries[1].amount).toBeNull();

    // Set payer amounts that sum to total
    act(() => result.current.form.actions.updatePayerAmount(playerA.id, 200000));
    act(() => result.current.form.actions.updatePayerAmount(playerB.id, 100000));

    expect(result.current.derived.payerTotal).toBe(300000);
    expect(result.current.derived.isPayerAmountValid).toBe(true);
    expect(result.current.derived.hasValidSettlement).toBe(true);
    expect(result.current.derived.settlementResult).not.toBeNull();
  });

  it('settlement is invalid when payer amounts do not match total', async () => {
    const r1 = await playerService.addPlayer('X');
    const r2 = await playerService.addPlayer('Y');
    expect(r1.ok && r2.ok).toBe(true);
    const players = await playerService.getAllPlayers();

    const { result } = renderHook(() => {
      const form = useSessionForm(players);
      const derived = useSessionDerived(form.state,
        players.filter(p => form.state.selectedPlayerIds.has(p.id))
          .map(p => ({ id: p.id, name: p.name }))
      );
      return { form, derived };
    });

    for (const p of players) {
      act(() => result.current.form.actions.togglePlayer(p.id));
    }

    const costId = result.current.form.state.costItems[0].id;
    act(() => result.current.form.actions.updateCostItem(costId, 'amount', 200000));

    // Select two payers with mismatched amounts
    act(() => result.current.form.actions.togglePayer(players[0].id));
    act(() => result.current.form.actions.togglePayer(players[1].id));
    act(() => result.current.form.actions.updatePayerAmount(players[0].id, 100000));
    act(() => result.current.form.actions.updatePayerAmount(players[1].id, 50000));

    expect(result.current.derived.payerTotal).toBe(150000);
    expect(result.current.derived.isPayerAmountValid).toBe(false);
    expect(result.current.derived.hasValidSettlement).toBe(false);
    expect(result.current.derived.settlementResult).toBeNull();
  });
});

describe('Integration: Player Management Flow', () => {
  it('add player → verify in database → delete → verify removed', async () => {
    // Add a player
    const addResult = await playerService.addPlayer('Bách');
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;
    const playerId = addResult.value.id;

    // Verify the player is in the database
    let allPlayers = await playerService.getAllPlayers();
    expect(allPlayers).toHaveLength(1);
    expect(allPlayers[0].name).toBe('Bách');

    // Delete the player
    const deleteResult = await playerService.deletePlayer(playerId);
    expect(deleteResult.ok).toBe(true);

    // Verify removed from database
    allPlayers = await playerService.getAllPlayers();
    expect(allPlayers).toHaveLength(0);
  });

  it('add player → use in session form → delete → verify reconciled out of session', async () => {
    // Add players
    const r1 = await playerService.addPlayer('Bách');
    const r2 = await playerService.addPlayer('Nam');
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;

    let players = await playerService.getAllPlayers();

    // Start session with both players selected
    const { result, rerender } = renderHook(
      ({ playerList }: { playerList: Player[] }) => useSessionForm(playerList),
      { initialProps: { playerList: players } }
    );

    // Select both players
    act(() => {
      result.current.actions.togglePlayer(r1.value.id);
      result.current.actions.togglePlayer(r2.value.id);
    });
    expect(result.current.state.selectedPlayerIds.size).toBe(2);

    // Select Bách as payer
    act(() => result.current.actions.togglePayer(r1.value.id));
    expect(result.current.state.selectedPayerIds.size).toBe(1);

    // Delete Bách from database
    await playerService.deletePlayer(r1.value.id);
    players = await playerService.getAllPlayers();
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('Nam');

    // Re-render with updated player list to trigger reconciliation
    rerender({ playerList: players });

    // Bách should be reconciled out of selected players and payers
    expect(result.current.state.selectedPlayerIds.has(r1.value.id)).toBe(false);
    expect(result.current.state.selectedPlayerIds.size).toBe(1);
    expect(result.current.state.selectedPayerIds.has(r1.value.id)).toBe(false);
    expect(result.current.state.selectedPayerIds.size).toBe(0);

    // Toast should notify about removal
    expect(result.current.state.toastMessage).toContain('Bách');
  });

  it('deleting a player from multi-payer triggers auto-fill on remaining single payer', async () => {
    const r1 = await playerService.addPlayer('A');
    const r2 = await playerService.addPlayer('B');
    const r3 = await playerService.addPlayer('C');
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
    if (!r1.ok || !r2.ok || !r3.ok) return;

    let players = await playerService.getAllPlayers();

    const { result, rerender } = renderHook(
      ({ playerList }: { playerList: Player[] }) => useSessionForm(playerList),
      { initialProps: { playerList: players } }
    );

    // Select all players
    for (const p of players) {
      act(() => result.current.actions.togglePlayer(p.id));
    }

    // Enter cost
    const costId = result.current.state.costItems[0].id;
    act(() => result.current.actions.updateCostItem(costId, 'amount', 300000));

    // Select A and B as payers (multi-payer)
    act(() => result.current.actions.togglePayer(r1.value.id));
    act(() => result.current.actions.togglePayer(r2.value.id));
    expect(result.current.state.selectedPayerIds.size).toBe(2);

    // Set payer amounts
    act(() => result.current.actions.updatePayerAmount(r1.value.id, 200000));
    act(() => result.current.actions.updatePayerAmount(r2.value.id, 100000));

    // Delete player A from database
    await playerService.deletePlayer(r1.value.id);
    players = await playerService.getAllPlayers();

    // Re-render with updated player list
    rerender({ playerList: players });

    // Should now have only B as payer, auto-filled with total
    expect(result.current.state.selectedPayerIds.size).toBe(1);
    expect(result.current.state.selectedPayerIds.has(r2.value.id)).toBe(true);
    expect(result.current.state.payerEntries).toHaveLength(1);
    expect(result.current.state.payerEntries[0].amount).toBe(300000);
  });
});

describe('Integration: History Flow', () => {
  it('complete session → save → query history → verify card data → get detail → verify all fields', async () => {
    // Step 1: Create players and build a complete session
    const r1 = await playerService.addPlayer('Bách');
    const r2 = await playerService.addPlayer('Nam');
    const r3 = await playerService.addPlayer('Huy');
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
    if (!r1.ok || !r2.ok || !r3.ok) return;

    const participants = [
      { id: r1.value.id, name: 'Bách' },
      { id: r2.value.id, name: 'Nam' },
      { id: r3.value.id, name: 'Huy' },
    ];

    const costItems = [
      { label: 'Sân', amount: 300000 },
      { label: 'Cầu', amount: 80000 },
      { label: 'Nước', amount: 120000 },
    ];
    const totalCost = 500000;

    // Calculate settlement
    const settlement = calculateSettlement({
      participants,
      totalCost,
      payers: [{ playerId: r1.value.id, amount: 500000 }],
    });
    expect(settlement.isSoloSession).toBe(false);
    expect(settlement.transfers.length).toBeGreaterThan(0);

    // Step 2: Persist session
    const sessionDate = new Date(2026, 2, 28);
    const sessionId = await sessionService.saveSession({
      date: sessionDate,
      participants,
      costItems,
      totalCost,
      payers: [{ playerId: r1.value.id, playerName: 'Bách', amount: 500000 }],
      transfers: settlement.transfers,
      note: 'Sân Tân Bình',
    });

    expect(sessionId).toBeTruthy();

    // Step 3: Query history list (sorted by date desc)
    const allSessions = await sessionService.getAllSessions();
    expect(allSessions).toHaveLength(1);

    // Verify card data
    const card = allSessions[0];
    expect(card.id).toBe(sessionId);
    expect(card.totalCost).toBe(500000);
    expect(card.participants).toHaveLength(3);
    expect(card.participants.map(p => p.name)).toContain('Bách');

    // Step 4: Get session detail by ID
    const detail = await sessionService.getSession(sessionId);
    expect(detail).not.toBeNull();

    // Verify all fields
    expect(detail!.date).toEqual(sessionDate);
    expect(detail!.participants).toEqual(participants);
    expect(detail!.costItems).toEqual(costItems);
    expect(detail!.totalCost).toBe(500000);
    expect(detail!.payers).toEqual([
      { playerId: r1.value.id, playerName: 'Bách', amount: 500000 },
    ]);
    expect(detail!.transfers).toEqual(settlement.transfers);
    expect(detail!.note).toBe('Sân Tân Bình');
  });

  it('multiple sessions are returned sorted by date descending', async () => {
    const participants = [{ id: 'p1', name: 'A' }];

    // Save sessions with different dates
    await sessionService.saveSession({
      date: new Date(2026, 0, 1), // Jan
      participants,
      costItems: [{ label: 'Sân', amount: 100000 }],
      totalCost: 100000,
      payers: [{ playerId: 'p1', playerName: 'A', amount: 100000 }],
      transfers: [],
      note: null,
    });

    await sessionService.saveSession({
      date: new Date(2026, 2, 28), // Mar
      participants,
      costItems: [{ label: 'Sân', amount: 300000 }],
      totalCost: 300000,
      payers: [{ playerId: 'p1', playerName: 'A', amount: 300000 }],
      transfers: [],
      note: null,
    });

    await sessionService.saveSession({
      date: new Date(2026, 1, 15), // Feb
      participants,
      costItems: [{ label: 'Sân', amount: 200000 }],
      totalCost: 200000,
      payers: [{ playerId: 'p1', playerName: 'A', amount: 200000 }],
      transfers: [],
      note: null,
    });

    const sessions = await sessionService.getAllSessions();
    expect(sessions).toHaveLength(3);
    // Should be sorted newest first
    expect(sessions[0].totalCost).toBe(300000); // Mar
    expect(sessions[1].totalCost).toBe(200000); // Feb
    expect(sessions[2].totalCost).toBe(100000); // Jan
  });

  it('delete session → verify removed from history', async () => {
    const sessionId = await sessionService.saveSession({
      date: new Date(2026, 2, 28),
      participants: [{ id: 'p1', name: 'A' }],
      costItems: [{ label: 'Sân', amount: 100000 }],
      totalCost: 100000,
      payers: [{ playerId: 'p1', playerName: 'A', amount: 100000 }],
      transfers: [],
      note: null,
    });

    let sessions = await sessionService.getAllSessions();
    expect(sessions).toHaveLength(1);

    await sessionService.deleteSession(sessionId);

    sessions = await sessionService.getAllSessions();
    expect(sessions).toHaveLength(0);

    const deleted = await sessionService.getSession(sessionId);
    expect(deleted).toBeNull();
  });

  it('session stores player name snapshots independent of player database', async () => {
    // Add player and create session
    const addResult = await playerService.addPlayer('Bách');
    expect(addResult.ok).toBe(true);
    if (!addResult.ok) return;

    const sessionId = await sessionService.saveSession({
      date: new Date(2026, 2, 28),
      participants: [{ id: addResult.value.id, name: 'Bách' }],
      costItems: [{ label: 'Sân', amount: 100000 }],
      totalCost: 100000,
      payers: [{ playerId: addResult.value.id, playerName: 'Bách', amount: 100000 }],
      transfers: [],
      note: null,
    });

    // Rename player in database
    await playerService.updatePlayer(addResult.value.id, 'Bách Updated');

    // Session should still have the original name snapshot
    const session = await sessionService.getSession(sessionId);
    expect(session!.participants[0].name).toBe('Bách');
    expect(session!.payers[0].playerName).toBe('Bách');
  });
});
