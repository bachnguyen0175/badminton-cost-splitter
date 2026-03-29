import { useState, useCallback, useEffect, useRef } from 'react';
import type { Player, CostItem, PayerEntry } from '../../core/types';

export interface SessionFormState {
  selectedPlayerIds: Set<string>;
  costItems: CostItem[];
  sessionNote: string;
  selectedPayerIds: Set<string>;
  payerEntries: PayerEntry[];
  isCopied: boolean;
  isPersisted: boolean;
  toastMessage: string | null;
}

export interface SessionFormActions {
  togglePlayer(playerId: string): void;
  selectAllPlayers(): void;
  deselectAllPlayers(): void;
  addCostItem(): void;
  updateCostItem(id: string, field: 'label' | 'amount', value: string | number): void;
  removeCostItem(id: string): void;
  togglePayer(playerId: string): void;
  updatePayerAmount(playerId: string, amount: number): void;
  setSessionNote(note: string): void;
  resetSession(): void;
  markCopied(): void;
  markPersisted(): void;
  dismissToast(): void;
}

export interface UseSessionFormReturn {
  state: SessionFormState;
  actions: SessionFormActions;
}

const MAX_COST_ITEMS = 10;

function createCostItem(): CostItem {
  return { id: crypto.randomUUID(), label: '', amount: null };
}

function createInitialState(): SessionFormState {
  return {
    selectedPlayerIds: new Set(),
    costItems: [createCostItem()],
    sessionNote: '',
    selectedPayerIds: new Set(),
    payerEntries: [],
    isCopied: false,
    isPersisted: false,
    toastMessage: null,
  };
}

function computeTotalCost(costItems: CostItem[]): number {
  return costItems.reduce((sum, item) => {
    if (item.amount !== null && item.amount > 0) {
      return sum + item.amount;
    }
    return sum;
  }, 0);
}

export function useSessionForm(players: Player[]): UseSessionFormReturn {
  const [state, setState] = useState<SessionFormState>(createInitialState);
  const prevPlayersRef = useRef<Map<string, Player>>(new Map(players.map(p => [p.id, p])));

  // Helper to reset copy/persist flags on input modification
  const withInputModification = useCallback(
    (updater: (prev: SessionFormState) => SessionFormState) => {
      setState(prev => {
        const next = updater(prev);
        return { ...next, isCopied: false, isPersisted: false };
      });
    },
    []
  );

  const togglePlayer = useCallback((playerId: string) => {
    withInputModification(prev => {
      const next = new Set(prev.selectedPlayerIds);
      if (next.has(playerId)) {
        next.delete(playerId);
        // Also remove from payers (subset invariant)
        if (prev.selectedPayerIds.has(playerId)) {
          const nextPayerIds = new Set(prev.selectedPayerIds);
          nextPayerIds.delete(playerId);
          const nextPayerEntries = prev.payerEntries.filter(e => e.playerId !== playerId);
          // If went from multi to single payer, auto-fill
          if (nextPayerIds.size === 1 && prev.selectedPayerIds.size > 1) {
            const totalCost = computeTotalCost(prev.costItems);
            return {
              ...prev,
              selectedPlayerIds: next,
              selectedPayerIds: nextPayerIds,
              payerEntries: nextPayerEntries.map(e => ({ ...e, amount: totalCost })),
            };
          }
          return {
            ...prev,
            selectedPlayerIds: next,
            selectedPayerIds: nextPayerIds,
            payerEntries: nextPayerEntries,
          };
        }
        return { ...prev, selectedPlayerIds: next };
      }
      next.add(playerId);
      return { ...prev, selectedPlayerIds: next };
    });
  }, [withInputModification]);

  const selectAllPlayers = useCallback(() => {
    withInputModification(prev => ({
      ...prev,
      selectedPlayerIds: new Set(players.map(p => p.id)),
    }));
  }, [withInputModification, players]);

  const deselectAllPlayers = useCallback(() => {
    withInputModification(prev => ({
      ...prev,
      selectedPlayerIds: new Set(),
      selectedPayerIds: new Set(),
      payerEntries: [],
    }));
  }, [withInputModification]);

  const addCostItem = useCallback(() => {
    withInputModification(prev => {
      if (prev.costItems.length >= MAX_COST_ITEMS) return prev;
      return { ...prev, costItems: [...prev.costItems, createCostItem()] };
    });
  }, [withInputModification]);

  const updateCostItem = useCallback(
    (id: string, field: 'label' | 'amount', value: string | number) => {
      withInputModification(prev => {
        const costItems = prev.costItems.map(item => {
          if (item.id !== id) return item;
          if (field === 'label') return { ...item, label: value as string };
          return { ...item, amount: value as number };
        });

        // If single payer, auto-fill with new total
        if (prev.selectedPayerIds.size === 1) {
          const totalCost = computeTotalCost(costItems);
          const payerEntries = prev.payerEntries.map(e => ({ ...e, amount: totalCost }));
          return { ...prev, costItems, payerEntries };
        }

        return { ...prev, costItems };
      });
    },
    [withInputModification]
  );

  const removeCostItem = useCallback(
    (id: string) => {
      withInputModification(prev => {
        const costItems = prev.costItems.filter(item => item.id !== id);

        // If single payer, auto-fill with new total
        if (prev.selectedPayerIds.size === 1) {
          const totalCost = computeTotalCost(costItems);
          const payerEntries = prev.payerEntries.map(e => ({ ...e, amount: totalCost }));
          return { ...prev, costItems, payerEntries };
        }

        return { ...prev, costItems };
      });
    },
    [withInputModification]
  );

  const togglePayer = useCallback(
    (playerId: string) => {
      withInputModification(prev => {
        // Must be a selected participant
        if (!prev.selectedPlayerIds.has(playerId)) return prev;

        const nextPayerIds = new Set(prev.selectedPayerIds);

        if (nextPayerIds.has(playerId)) {
          // Remove payer
          nextPayerIds.delete(playerId);
          const nextEntries = prev.payerEntries.filter(e => e.playerId !== playerId);

          // If went from multi to single, auto-fill remaining
          if (nextPayerIds.size === 1 && prev.selectedPayerIds.size > 1) {
            const totalCost = computeTotalCost(prev.costItems);
            return {
              ...prev,
              selectedPayerIds: nextPayerIds,
              payerEntries: nextEntries.map(e => ({ ...e, amount: totalCost })),
            };
          }

          return { ...prev, selectedPayerIds: nextPayerIds, payerEntries: nextEntries };
        }

        // Add payer
        nextPayerIds.add(playerId);

        if (prev.selectedPayerIds.size === 0) {
          // First payer — auto-fill with total
          const totalCost = computeTotalCost(prev.costItems);
          return {
            ...prev,
            selectedPayerIds: nextPayerIds,
            payerEntries: [{ playerId, amount: totalCost }],
          };
        }

        // Transitioning from single to multi-payer: clear all amounts
        if (prev.selectedPayerIds.size === 1) {
          const clearedEntries = prev.payerEntries.map(e => ({ ...e, amount: null as number | null }));
          return {
            ...prev,
            selectedPayerIds: nextPayerIds,
            payerEntries: [...clearedEntries, { playerId, amount: null }],
          };
        }

        // Already multi-payer, just add
        return {
          ...prev,
          selectedPayerIds: nextPayerIds,
          payerEntries: [...prev.payerEntries, { playerId, amount: null }],
        };
      });
    },
    [withInputModification]
  );

  const updatePayerAmount = useCallback(
    (playerId: string, amount: number) => {
      withInputModification(prev => ({
        ...prev,
        payerEntries: prev.payerEntries.map(e =>
          e.playerId === playerId ? { ...e, amount } : e
        ),
      }));
    },
    [withInputModification]
  );

  const setSessionNote = useCallback(
    (note: string) => {
      withInputModification(prev => ({ ...prev, sessionNote: note }));
    },
    [withInputModification]
  );

  const resetSession = useCallback(() => {
    setState(createInitialState());
  }, []);

  const markCopied = useCallback(() => {
    setState(prev => ({ ...prev, isCopied: true }));
  }, []);

  const markPersisted = useCallback(() => {
    setState(prev => ({ ...prev, isPersisted: true }));
  }, []);

  const dismissToast = useCallback(() => {
    setState(prev => ({ ...prev, toastMessage: null }));
  }, []);

  // Active session reconciliation when player list changes
  useEffect(() => {
    const currentPlayerIds = new Set(players.map(p => p.id));
    const prevPlayers = prevPlayersRef.current;

    // Check if any selected player was removed
    const removedIds = new Set<string>();
    for (const id of prevPlayers.keys()) {
      if (!currentPlayerIds.has(id)) removedIds.add(id);
    }

    prevPlayersRef.current = new Map(players.map(p => [p.id, p]));

    if (removedIds.size === 0) return;

    setState(prev => {
      let changed = false;

      // Reconcile selectedPlayerIds
      const nextPlayerIds = new Set(prev.selectedPlayerIds);
      const removedSelectedNames: string[] = [];
      for (const id of removedIds) {
        if (nextPlayerIds.has(id)) {
          nextPlayerIds.delete(id);
          const player = prevPlayers.get(id);
          if (player) removedSelectedNames.push(player.name);
          changed = true;
        }
      }

      // Reconcile selectedPayerIds and payerEntries
      const nextPayerIds = new Set(prev.selectedPayerIds);
      let nextPayerEntries = prev.payerEntries;
      for (const id of removedIds) {
        if (nextPayerIds.has(id)) {
          nextPayerIds.delete(id);
          nextPayerEntries = nextPayerEntries.filter(e => e.playerId !== id);
          changed = true;
        }
      }

      if (!changed) return prev;

      // If multi-payer reduced to single payer, auto-fill
      if (nextPayerIds.size === 1 && prev.selectedPayerIds.size > 1) {
        const totalCost = computeTotalCost(prev.costItems);
        nextPayerEntries = nextPayerEntries.map(e => ({ ...e, amount: totalCost }));
      }

      // Build toast message
      const toastMessage = removedSelectedNames.length > 0
        ? `${removedSelectedNames.join(', ')} was removed from current session`
        : null;

      return {
        ...prev,
        selectedPlayerIds: nextPlayerIds,
        selectedPayerIds: nextPayerIds,
        payerEntries: nextPayerEntries,
        toastMessage,
      };
    });
  }, [players]);

  return {
    state,
    actions: {
      togglePlayer,
      selectAllPlayers,
      deselectAllPlayers,
      addCostItem,
      updateCostItem,
      removeCostItem,
      togglePayer,
      updatePayerAmount,
      setSessionNote,
      resetSession,
      markCopied,
      markPersisted,
      dismissToast,
    },
  };
}
