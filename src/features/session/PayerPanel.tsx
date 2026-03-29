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
      <h3 className="text-sm font-medium text-gray-700 mb-2">Who Paid?</h3>

      <div className="flex flex-wrap gap-2 mb-3">
        {participants.map(p => {
          const isSelected = selectedPayerIds.has(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onTogglePayer(p.id)}
              className={`px-3 py-2 rounded-full text-sm font-medium min-h-[44px] min-w-[44px] transition-colors ${
                isSelected
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {isSinglePayer && (
        <div className="text-sm text-gray-600">
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
                <span className="text-sm text-gray-700 py-2 min-w-[60px]">
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
                    className={`w-28 px-3 py-2 min-h-[44px] border rounded-md text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasError ? 'border-red-500' : ''
                    }`}
                  />
                  {hasError && (
                    <p className="text-xs text-red-600 mt-1">Must be greater than zero</p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="mt-2 text-sm font-medium text-gray-700">
            Payer total: {formattedTotal}
          </div>

          {showMismatchWarning && (
            <p className="text-sm text-red-600 font-medium">
              Payer total does not match session total cost
            </p>
          )}
        </div>
      )}

      {!hasSelectedPayers && (
        <p className="text-sm text-gray-500">Select who paid for this session</p>
      )}
    </div>
  );
}
