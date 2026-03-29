import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionDerived } from './useSessionDerived';
import type { SessionFormState } from './useSessionForm';
import type { CostItem } from '../../core/types';

function makeState(overrides: Partial<SessionFormState> = {}): SessionFormState {
  return {
    selectedPlayerIds: new Set<string>(),
    costItems: [{ id: 'c1', label: '', amount: null }],
    sessionNote: '',
    selectedPayerIds: new Set<string>(),
    payerEntries: [],
    isCopied: false,
    isPersisted: false,
    toastMessage: null,
    ...overrides,
  };
}

function makeParticipants(ids: string[]): Array<{ id: string; name: string }> {
  return ids.map(id => ({ id, name: `Player ${id}` }));
}

function makeCostItems(amounts: (number | null)[]): CostItem[] {
  return amounts.map((amount, i) => ({
    id: `c${i + 1}`,
    label: amount !== null ? `Item ${i + 1}` : '',
    amount,
  }));
}

describe('useSessionDerived', () => {
  // --- totalCost ---

  it('computes totalCost as sum of valid cost items', () => {
    const state = makeState({
      costItems: makeCostItems([100000, 200000, 50000]),
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.totalCost).toBe(350000);
  });

  it('excludes null and zero amounts from totalCost', () => {
    const state = makeState({
      costItems: makeCostItems([100000, null, 0, 200000]),
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.totalCost).toBe(300000);
  });

  it('returns totalCost 0 when no valid cost items', () => {
    const state = makeState({
      costItems: makeCostItems([null]),
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.totalCost).toBe(0);
  });

  // --- payerTotal ---

  it('computes payerTotal as sum of payer entry amounts', () => {
    const state = makeState({
      selectedPayerIds: new Set(['p1', 'p2']),
      payerEntries: [
        { playerId: 'p1', amount: 200000 },
        { playerId: 'p2', amount: 100000 },
      ],
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.payerTotal).toBe(300000);
  });

  it('treats null payer amounts as 0 in payerTotal', () => {
    const state = makeState({
      selectedPayerIds: new Set(['p1', 'p2']),
      payerEntries: [
        { playerId: 'p1', amount: 200000 },
        { playerId: 'p2', amount: null },
      ],
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.payerTotal).toBe(200000);
  });

  it('returns payerTotal 0 when no payers', () => {
    const state = makeState();
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.payerTotal).toBe(0);
  });

  // --- isPayerAmountValid ---

  it('isPayerAmountValid is true when payerTotal matches totalCost', () => {
    const state = makeState({
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 300000 }],
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.isPayerAmountValid).toBe(true);
  });

  it('isPayerAmountValid is false when payerTotal does not match totalCost', () => {
    const state = makeState({
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 200000 }],
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.isPayerAmountValid).toBe(false);
  });

  it('isPayerAmountValid is false when no payers selected but cost exists', () => {
    const state = makeState({
      costItems: makeCostItems([300000]),
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.isPayerAmountValid).toBe(false);
  });

  // --- hasValidSettlement ---

  it('hasValidSettlement is true when participants selected, costs entered, and payer amounts match', () => {
    const state = makeState({
      selectedPlayerIds: new Set(['p1', 'p2']),
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 300000 }],
    });
    const participants = makeParticipants(['p1', 'p2']);
    const { result } = renderHook(() => useSessionDerived(state, participants));
    expect(result.current.hasValidSettlement).toBe(true);
  });

  it('hasValidSettlement is false when no participants', () => {
    const state = makeState({
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 300000 }],
    });
    const { result } = renderHook(() => useSessionDerived(state, []));
    expect(result.current.hasValidSettlement).toBe(false);
  });

  it('hasValidSettlement is false when totalCost is 0', () => {
    const state = makeState({
      selectedPlayerIds: new Set(['p1', 'p2']),
      costItems: makeCostItems([null]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 0 }],
    });
    const participants = makeParticipants(['p1', 'p2']);
    const { result } = renderHook(() => useSessionDerived(state, participants));
    expect(result.current.hasValidSettlement).toBe(false);
  });

  it('hasValidSettlement is false when payer amounts do not match total', () => {
    const state = makeState({
      selectedPlayerIds: new Set(['p1', 'p2']),
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 100000 }],
    });
    const participants = makeParticipants(['p1', 'p2']);
    const { result } = renderHook(() => useSessionDerived(state, participants));
    expect(result.current.hasValidSettlement).toBe(false);
  });

  // --- settlementResult ---

  it('returns settlementResult with transfers when settlement is valid', () => {
    const state = makeState({
      selectedPlayerIds: new Set(['p1', 'p2']),
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 300000 }],
    });
    const participants = makeParticipants(['p1', 'p2']);
    const { result } = renderHook(() => useSessionDerived(state, participants));

    expect(result.current.settlementResult).not.toBeNull();
    expect(result.current.settlementResult!.transfers).toHaveLength(1);
    expect(result.current.settlementResult!.transfers[0].fromPlayerId).toBe('p2');
    expect(result.current.settlementResult!.transfers[0].toPlayerId).toBe('p1');
    expect(result.current.settlementResult!.transfers[0].exactAmount).toBe(150000);
  });

  it('returns null settlementResult when settlement is invalid', () => {
    const state = makeState({
      selectedPlayerIds: new Set(['p1']),
      costItems: makeCostItems([null]),
    });
    const { result } = renderHook(() => useSessionDerived(state, makeParticipants(['p1'])));
    expect(result.current.settlementResult).toBeNull();
  });

  it('returns solo session result for single participant', () => {
    const state = makeState({
      selectedPlayerIds: new Set(['p1']),
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 300000 }],
    });
    const participants = makeParticipants(['p1']);
    const { result } = renderHook(() => useSessionDerived(state, participants));

    expect(result.current.settlementResult).not.toBeNull();
    expect(result.current.settlementResult!.isSoloSession).toBe(true);
    expect(result.current.settlementResult!.transfers).toHaveLength(0);
  });

  it('computes settlement with multiple payers', () => {
    const state = makeState({
      selectedPlayerIds: new Set(['p1', 'p2', 'p3']),
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1', 'p2']),
      payerEntries: [
        { playerId: 'p1', amount: 200000 },
        { playerId: 'p2', amount: 100000 },
      ],
    });
    const participants = makeParticipants(['p1', 'p2', 'p3']);
    const { result } = renderHook(() => useSessionDerived(state, participants));

    expect(result.current.hasValidSettlement).toBe(true);
    expect(result.current.settlementResult).not.toBeNull();
    expect(result.current.settlementResult!.transfers.length).toBeGreaterThan(0);
  });

  // --- recomputation on state change ---

  it('recomputes when state changes', () => {
    const state1 = makeState({
      selectedPlayerIds: new Set(['p1', 'p2']),
      costItems: makeCostItems([300000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 300000 }],
    });
    const participants = makeParticipants(['p1', 'p2']);

    const { result, rerender } = renderHook(
      ({ state, participants }) => useSessionDerived(state, participants),
      { initialProps: { state: state1, participants } }
    );

    expect(result.current.totalCost).toBe(300000);

    const state2 = makeState({
      selectedPlayerIds: new Set(['p1', 'p2']),
      costItems: makeCostItems([500000]),
      selectedPayerIds: new Set(['p1']),
      payerEntries: [{ playerId: 'p1', amount: 500000 }],
    });

    rerender({ state: state2, participants });
    expect(result.current.totalCost).toBe(500000);
    expect(result.current.settlementResult!.transfers[0].exactAmount).toBe(250000);
  });
});
