import type { Transfer } from './types';
import { formatVnd } from './vndFormat';

export interface CopyResult {
  success: boolean;
  text: string;
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatSettlementText(
  transfers: Transfer[],
  totalCost: number,
  costItems: Array<{ label: string; amount: number }>,
  participants: Array<{ id: string; name: string }>,
  sessionNote: string | null,
  date: Date
): string {
  const lines: string[] = [];

  lines.push(`🏸 Cầu lông - ${formatDate(date)}`);

  if (sessionNote && sessionNote.trim().length > 0) {
    lines.push(sessionNote.trim());
  }

  const itemBreakdown = costItems
    .map((item) => `${item.label}: ${formatVnd(item.amount)}`)
    .join(', ');
  lines.push(`💰 Tổng: ${formatVnd(totalCost)} (${itemBreakdown})`);

  lines.push(`👥 ${participants.length} người chơi`);

  lines.push('');
  lines.push('💸 Kết quả:');
  for (const t of transfers) {
    lines.push(`- ${t.fromPlayerName} → ${t.toPlayerName}: ${formatVnd(t.roundedAmount)}`);
  }

  return lines.join('\n');
}

export async function copySettlementSummary(
  transfers: Transfer[],
  totalCost: number,
  costItems: Array<{ label: string; amount: number }>,
  participants: Array<{ id: string; name: string }>,
  sessionNote: string | null,
  date: Date
): Promise<CopyResult> {
  const text = formatSettlementText(
    transfers,
    totalCost,
    costItems,
    participants,
    sessionNote,
    date
  );

  try {
    if (!navigator?.clipboard?.writeText) {
      return { success: false, text };
    }
    await navigator.clipboard.writeText(text);
    return { success: true, text };
  } catch {
    return { success: false, text };
  }
}
