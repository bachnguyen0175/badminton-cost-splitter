import type { SettlementInput, SettlementResult, Transfer } from './types';
import { roundVnd } from './vndFormat';

export function calculateSettlement(input: SettlementInput): SettlementResult {
  const { participants, totalCost, payers } = input;

  if (participants.length === 1) {
    return { transfers: [], isSoloSession: true };
  }

  const fairShare = totalCost / participants.length;

  const paidMap = new Map<string, number>();
  for (const payer of payers) {
    paidMap.set(payer.playerId, (paidMap.get(payer.playerId) ?? 0) + payer.amount);
  }

  // net balance: positive = creditor (overpaid), negative = debtor (underpaid)
  const balances: Array<{ id: string; name: string; balance: number }> = [];
  for (const p of participants) {
    const paid = paidMap.get(p.id) ?? 0;
    const balance = paid - fairShare;
    if (Math.abs(balance) > 0.01) {
      balances.push({ id: p.id, name: p.name, balance });
    }
  }

  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.balance, -debtor.balance);

    transfers.push({
      fromPlayerId: debtor.id,
      fromPlayerName: debtor.name,
      toPlayerId: creditor.id,
      toPlayerName: creditor.name,
      exactAmount: amount,
      roundedAmount: roundVnd(amount),
    });

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance < 0.01) ci++;
    if (-debtor.balance < 0.01) di++;
  }

  return { transfers, isSoloSession: false };
}
