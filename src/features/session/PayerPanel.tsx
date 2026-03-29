import type { PayerEntry } from '../../core/types';
import { formatVnd } from '../../core/vndFormat';

interface PayerPanelProps {
  participants: Array<{ id: string; name: string }>;
  selectedPayerIds: Set<string>;
  payerEntries: PayerEntry[];
  totalCost: number;
  payerTotal: number;
  isPayerAmountValid: boolean;
  onTogglePayer: (playerId: string) => void;
  onUpdatePayerAmount: (playerId: string, amount: number) => void;
}

export function PayerPanel({
  participants,
  selectedPayerIds,
  payerEntries,
  totalCost,
  payerTotal,
  isPayerAmountValid,
  onTogglePayer,
  onUpdatePayerAmount,
}: PayerPanelProps) {
  const isMultiPayer = selectedPayerIds.size > 1;
  const isSinglePayer = selectedPayerIds.size === 1;
  const hasSelectedPayers = selectedPayerIds.size > 0;

  const formattedTotal = formatVnd(isSinglePayer ? totalCost : payerTotal);

  const participantMap = new Map(participants.map(p => [p.id, p]));

  const showMismatchWarning =
    isMultiPayer && !isPayerAmountValid && payerEntries.some(e => e.amount !== null);

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Who Paid?</h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {participants.map(p => {
          const isSelected = selectedPayerIds.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onTogglePayer(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium min-h-[44px] min-w-[44px] transition-all duration-300 hover:scale-105 active:scale-95 ${
                isSelected
                  ? 'bg-secondary text-secondary-foreground shadow-[0_4px_20px_-2px_rgba(193,140,93,0.2)]'
                  : 'bg-accent text-accent-foreground hover:bg-accent/80'
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {isSinglePayer && (
        <div className="text-sm text-muted-foreground">
          Paid: {formattedTotal}
        </div>
      )}

      {isMultiPayer && (
        <div className="space-y-2">
          {payerEntries.map(entry => {
            const player = participantMap.get(entry.playerId);
            if (!player) return null;
            const hasError = entry.amount !== null && entry.amount <= 0;
            return (
              <div key={entry.playerId} className="flex items-start gap-2">
                <span className="text-sm text-foreground py-2 min-w-[60px]">
                  {player.name}
                </span>
                <div className="flex flex-col">
                  <input
                    inputMode="numeric"
                    value={entry.amount !== null ? entry.amount : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        onUpdatePayerAmount(entry.playerId, 0);
                        return;
                      }
                      const num = Number(val);
                      if (!Number.isNaN(num)) {
                        onUpdatePayerAmount(entry.playerId, num);
                      }
                    }}
                    placeholder="Amount"
                    className={`w-28 px-4 py-2 min-h-[44px] border rounded-full text-sm text-right bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 transition-all duration-300 ${
                      hasError ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  {hasError && (
                    <p className="text-xs text-destructive mt-1">Must be greater than zero</p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="mt-2 text-sm font-medium text-foreground">
            Payer total: {formattedTotal}
          </div>

          {showMismatchWarning && (
            <p className="text-sm text-destructive font-medium">
              Payer total does not match session total cost
            </p>
          )}
        </div>
      )}

      {!hasSelectedPayers && (
        <p className="text-sm text-muted-foreground">Select who paid for this session</p>
      )}
    </div>
  );
}
