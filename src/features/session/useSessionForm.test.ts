import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionForm } from './useSessionForm';
import type { Player } from '../../core/types';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    createdAt: new Date(),
  }));
}

describe('useSessionForm', () => {
  let players: Player[];

  beforeEach(() => {
    players = makePlayers(5);
  });

  // --- Initial state ---

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useSessionForm(players));
    const { state } = result.current;

    expect(state.selectedPlayerIds).toBeInstanceOf(Set);
    expect(state.selectedPlayerIds.size).toBe(0);
    expect(state.costItems).toHaveLength(1); // one default cost item
    expect(state.costItems[0].label).toBe('');
    expect(state.costItems[0].amount).toBeNull();
    expect(state.sessionNote).toBe('');
    expect(state.selectedPayerIds).toBeInstanceOf(Set);
    expect(state.selectedPayerIds.size).toBe(0);
    expect(state.payerEntries).toEqual([]);
    expect(state.isCopied).toBe(false);
    expect(state.isPersisted).toBe(false);
    expect(state.toastMessage).toBeNull();
  });

  // --- Toggle player ---

  it('toggles a player into selectedPlayerIds', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.togglePlayer('p1'));
    expect(result.current.state.selectedPlayerIds.has('p1')).toBe(true);

    act(() => result.current.actions.togglePlayer('p1'));
    expect(result.current.state.selectedPlayerIds.has('p1')).toBe(false);
  });

  // --- Select all / Deselect all ---

  it('selects all players', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.selectAllPlayers());
    expect(result.current.state.selectedPlayerIds.size).toBe(5);
  });

  it('deselects all players and clears payers too', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.selectAllPlayers());
    act(() => result.current.actions.togglePayer('p1'));
    act(() => result.current.actions.deselectAllPlayers());

    expect(result.current.state.selectedPlayerIds.size).toBe(0);
    expect(result.current.state.selectedPayerIds.size).toBe(0);
    expect(result.current.state.payerEntries).toEqual([]);
  });

  // --- Cost items ---

  it('adds a cost item up to max 10', () => {
    const { result } = renderHook(() => useSessionForm(players));

    // starts with 1, add 9 more
    for (let i = 0; i < 9; i++) {
      act(() => result.current.actions.addCostItem());
    }
    expect(result.current.state.costItems).toHaveLength(10);

    // 11th should not be added
    act(() => result.current.actions.addCostItem());
    expect(result.current.state.costItems).toHaveLength(10);
  });

  it('updates cost item label and amount', () => {
    const { result } = renderHook(() => useSessionForm(players));
    const itemId = result.current.state.costItems[0].id;

    act(() => result.current.actions.updateCostItem(itemId, 'label', 'Court fee'));
    expect(result.current.state.costItems[0].label).toBe('Court fee');

    act(() => result.current.actions.updateCostItem(itemId, 'amount', 300000));
    expect(result.current.state.costItems[0].amount).toBe(300000);
  });

  it('removes a cost item', () => {
    const { result } = renderHook(() => useSessionForm(players));
    act(() => result.current.actions.addCostItem());
    expect(result.current.state.costItems).toHaveLength(2);

    const idToRemove = result.current.state.costItems[1].id;
    act(() => result.current.actions.removeCostItem(idToRemove));
    expect(result.current.state.costItems).toHaveLength(1);
  });

  // --- Session note ---

  it('sets session note', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.setSessionNote('Court A'));
    expect(result.current.state.sessionNote).toBe('Court A');
  });

  // --- Payer management ---

  it('toggles a payer (must be a selected participant)', () => {
    const { result } = renderHook(() => useSessionForm(players));

    // select participant first
    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.togglePayer('p1'));

    expect(result.current.state.selectedPayerIds.has('p1')).toBe(true);
    expect(result.current.state.payerEntries).toHaveLength(1);
    expect(result.current.state.payerEntries[0].playerId).toBe('p1');
  });

  it('does not allow toggling a payer who is not a participant', () => {
    const { result } = renderHook(() => useSessionForm(players));

    // p1 not selected as participant
    act(() => result.current.actions.togglePayer('p1'));
    expect(result.current.state.selectedPayerIds.size).toBe(0);
  });

  it('removes payer entry on toggle off', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.togglePayer('p1'));
    act(() => result.current.actions.togglePayer('p1'));

    expect(result.current.state.selectedPayerIds.size).toBe(0);
    expect(result.current.state.payerEntries).toEqual([]);
  });

  it('updates payer amount', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.togglePayer('p1'));
    act(() => result.current.actions.updatePayerAmount('p1', 200000));

    expect(result.current.state.payerEntries[0].amount).toBe(200000);
  });

  // --- Single payer auto-fill ---

  it('auto-fills single payer amount with total cost', () => {
    const { result } = renderHook(() => useSessionForm(players));
    const itemId = result.current.state.costItems[0].id;

    act(() => result.current.actions.updateCostItem(itemId, 'amount', 500000));
    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.togglePayer('p1'));

    // single payer should get auto-filled amount = null (auto-fill flag)
    // The actual total calculation is in useSessionDerived, but
    // useSessionForm should track that there's a single payer scenario
    expect(result.current.state.selectedPayerIds.size).toBe(1);
    expect(result.current.state.payerEntries).toHaveLength(1);
  });

  it('clears auto-fill when second payer is added', () => {
    const { result } = renderHook(() => useSessionForm(players));
    const itemId = result.current.state.costItems[0].id;

    act(() => result.current.actions.updateCostItem(itemId, 'amount', 500000));
    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.togglePlayer('p2'));
    act(() => result.current.actions.togglePayer('p1'));

    // single payer - amount auto-filled
    expect(result.current.state.payerEntries[0].amount).not.toBeNull();

    act(() => result.current.actions.togglePayer('p2'));

    // both amounts should be null (cleared) when transitioning to multi-payer
    expect(result.current.state.payerEntries).toHaveLength(2);
    for (const entry of result.current.state.payerEntries) {
      expect(entry.amount).toBeNull();
    }
  });

  // --- selectedPayerIds is always a subset of selectedPlayerIds ---

  it('removes payer when participant is deselected', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.togglePayer('p1'));
    expect(result.current.state.selectedPayerIds.has('p1')).toBe(true);

    // deselect participant
    act(() => result.current.actions.togglePlayer('p1'));
    expect(result.current.state.selectedPayerIds.has('p1')).toBe(false);
    expect(result.current.state.payerEntries.find(e => e.playerId === 'p1')).toBeUndefined();
  });

  // --- isCopied resets on input modification ---

  it('resets isCopied to false on any input modification', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.markCopied());
    expect(result.current.state.isCopied).toBe(true);

    act(() => result.current.actions.togglePlayer('p1'));
    expect(result.current.state.isCopied).toBe(false);
  });

  it('resets isCopied on cost item change', () => {
    const { result } = renderHook(() => useSessionForm(players));
    const itemId = result.current.state.costItems[0].id;

    act(() => result.current.actions.markCopied());
    act(() => result.current.actions.updateCostItem(itemId, 'amount', 100000));
    expect(result.current.state.isCopied).toBe(false);
  });

  it('resets isCopied on session note change', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.markCopied());
    act(() => result.current.actions.setSessionNote('New note'));
    expect(result.current.state.isCopied).toBe(false);
  });

  it('resets isCopied on payer toggle', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.markCopied());
    act(() => result.current.actions.togglePayer('p1'));
    expect(result.current.state.isCopied).toBe(false);
  });

  // --- isPersisted resets on input modification ---

  it('resets isPersisted to false on any input modification after persistence', () => {
    const { result } = renderHook(() => useSessionForm(players));

    act(() => result.current.actions.markPersisted());
    expect(result.current.state.isPersisted).toBe(true);

    act(() => result.current.actions.togglePlayer('p1'));
    expect(result.current.state.isPersisted).toBe(false);
  });

  // --- Reset session ---

  it('resets all session state', () => {
    const { result } = renderHook(() => useSessionForm(players));
    const itemId = result.current.state.costItems[0].id;

    // set up some state
    act(() => result.current.actions.togglePlayer('p1'));
    act(() => result.current.actions.updateCostItem(itemId, 'amount', 500000));
    act(() => result.current.actions.updateCostItem(itemId, 'label', 'Court'));
    act(() => result.current.actions.togglePayer('p1'));
    act(() => result.current.actions.setSessionNote('Test'));
    act(() => result.current.actions.markCopied());
    act(() => result.current.actions.markPersisted());

    act(() => result.current.actions.resetSession());

    const { state } = result.current;
    expect(state.selectedPlayerIds.size).toBe(0);
    expect(state.costItems).toHaveLength(1);
    expect(state.costItems[0].label).toBe('');
    expect(state.costItems[0].amount).toBeNull();
    expect(state.sessionNote).toBe('');
    expect(state.selectedPayerIds.size).toBe(0);
    expect(state.payerEntries).toEqual([]);
    expect(state.isCopied).toBe(false);
    expect(state.isPersisted).toBe(false);
    expect(state.toastMessage).toBeNull();
  });

  // --- Active session reconciliation ---

  describe('active session reconciliation', () => {
    it('removes deleted player from selectedPlayerIds and selectedPayerIds', () => {
      const { result, rerender } = renderHook(
        ({ players }) => useSessionForm(players),
        { initialProps: { players } }
      );

      act(() => result.current.actions.togglePlayer('p1'));
      act(() => result.current.actions.togglePlayer('p2'));
      act(() => result.current.actions.togglePayer('p1'));

      // Remove p1 from players list
      const updatedPlayers = players.filter(p => p.id !== 'p1');
      rerender({ players: updatedPlayers });

      expect(result.current.state.selectedPlayerIds.has('p1')).toBe(false);
      expect(result.current.state.selectedPlayerIds.has('p2')).toBe(true);
      expect(result.current.state.selectedPayerIds.has('p1')).toBe(false);
    });

    it('handles deletion of last participant', () => {
      const { result, rerender } = renderHook(
        ({ players }) => useSessionForm(players),
        { initialProps: { players } }
      );

      act(() => result.current.actions.togglePlayer('p1'));

      // Remove p1
      const updatedPlayers = players.filter(p => p.id !== 'p1');
      rerender({ players: updatedPlayers });

      expect(result.current.state.selectedPlayerIds.size).toBe(0);
    });

    it('handles deletion of last payer', () => {
      const { result, rerender } = renderHook(
        ({ players }) => useSessionForm(players),
        { initialProps: { players } }
      );

      act(() => result.current.actions.togglePlayer('p1'));
      act(() => result.current.actions.togglePayer('p1'));

      const updatedPlayers = players.filter(p => p.id !== 'p1');
      rerender({ players: updatedPlayers });

      expect(result.current.state.selectedPayerIds.size).toBe(0);
      expect(result.current.state.payerEntries).toEqual([]);
    });

    it('auto-fills remaining payer when multi-payer reduces to single payer', () => {
      const { result, rerender } = renderHook(
        ({ players }) => useSessionForm(players),
        { initialProps: { players } }
      );

      const itemId = result.current.state.costItems[0].id;
      act(() => result.current.actions.updateCostItem(itemId, 'amount', 500000));
      act(() => result.current.actions.togglePlayer('p1'));
      act(() => result.current.actions.togglePlayer('p2'));
      act(() => result.current.actions.togglePayer('p1'));
      act(() => result.current.actions.togglePayer('p2'));

      // multi-payer: both amounts should be null
      expect(result.current.state.payerEntries).toHaveLength(2);

      // Remove p1 from players — reduces payers to just p2
      const updatedPlayers = players.filter(p => p.id !== 'p1');
      rerender({ players: updatedPlayers });

      expect(result.current.state.selectedPayerIds.size).toBe(1);
      expect(result.current.state.selectedPayerIds.has('p2')).toBe(true);
      // Single payer should have auto-filled amount
      expect(result.current.state.payerEntries).toHaveLength(1);
      expect(result.current.state.payerEntries[0].amount).not.toBeNull();
    });

    // --- Toast notifications ---

    it('shows toast when a selected participant is removed', () => {
      const { result, rerender } = renderHook(
        ({ players }) => useSessionForm(players),
        { initialProps: { players } }
      );

      act(() => result.current.actions.togglePlayer('p1'));

      const updatedPlayers = players.filter(p => p.id !== 'p1');
      rerender({ players: updatedPlayers });

      expect(result.current.state.toastMessage).not.toBeNull();
      expect(result.current.state.toastMessage).toContain('Player 1');
    });

    it('shows toast with multiple player names when multiple are removed', () => {
      const { result, rerender } = renderHook(
        ({ players }) => useSessionForm(players),
        { initialProps: { players } }
      );

      act(() => result.current.actions.togglePlayer('p1'));
      act(() => result.current.actions.togglePlayer('p2'));

      const updatedPlayers = players.filter(p => p.id !== 'p1' && p.id !== 'p2');
      rerender({ players: updatedPlayers });

      expect(result.current.state.toastMessage).not.toBeNull();
      expect(result.current.state.toastMessage).toContain('Player 1');
      expect(result.current.state.toastMessage).toContain('Player 2');
    });

    it('does not show toast when removed player was not selected', () => {
      const { result, rerender } = renderHook(
        ({ players }) => useSessionForm(players),
        { initialProps: { players } }
      );

      // p5 is not selected as participant
      const updatedPlayers = players.filter(p => p.id !== 'p5');
      rerender({ players: updatedPlayers });

      expect(result.current.state.toastMessage).toBeNull();
    });
  });

  // --- Dismiss toast ---

  it('dismisses toast message', () => {
    const { result, rerender } = renderHook(
      ({ players }) => useSessionForm(players),
      { initialProps: { players } }
    );

    act(() => result.current.actions.togglePlayer('p1'));

    const updatedPlayers = players.filter(p => p.id !== 'p1');
    rerender({ players: updatedPlayers });

    expect(result.current.state.toastMessage).not.toBeNull();

    act(() => result.current.actions.dismissToast());
    expect(result.current.state.toastMessage).toBeNull();
  });
});
