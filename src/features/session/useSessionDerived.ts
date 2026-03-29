import { useMemo } from 'react';
import { calculateSettlement } from '../../core/settlementEngine';
import type { SessionFormState } from './useSessionForm';
import type { SettlementResult } from '../../core/types';

export interface SessionDerived {
  totalCost: number;
  payerTotal: number;
  isPayerAmountValid: boolean;
  hasValidSettlement: boolean;
  settlementResult: SettlementResult | null;
}

export function useSessionDerived(
  state: SessionFormState,
  participants: Array<{ id: string; name: string }>
): SessionDerived {
  return useMemo(() => {
    const totalCost = state.costItems.reduce((sum, item) => {
      if (item.amount !== null && item.amount > 0) {
        return sum + item.amount;
      }
      return sum;
    }, 0);

    const payerTotal = state.payerEntries.reduce((sum, entry) => {
      return sum + (entry.amount ?? 0);
    }, 0);

    const isPayerAmountValid = totalCost > 0 && payerTotal === totalCost;

    const hasValidSettlement =
      participants.length > 0 && totalCost > 0 && isPayerAmountValid;

    let settlementResult: SettlementResult | null = null;
    if (hasValidSettlement) {
      settlementResult = calculateSettlement({
        participants,
        totalCost,
        payers: state.payerEntries
          .filter((e): e is { playerId: string; amount: number } => e.amount !== null)
          .map(e => ({ playerId: e.playerId, amount: e.amount })),
      });
    }

    return {
      totalCost,
      payerTotal,
      isPayerAmountValid,
      hasValidSettlement,
      settlementResult,
    };
  }, [state, participants]);
}
