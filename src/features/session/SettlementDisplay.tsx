import type { SettlementResult } from '../../core/types';
import { formatVndWithExact } from '../../core/vndFormat';

interface SettlementDisplayProps {
  settlementResult: SettlementResult | null;
}

export function SettlementDisplay({ settlementResult }: SettlementDisplayProps) {
  if (!settlementResult) return null;

  if (settlementResult.isSoloSession) {
    return (
      <div className="p-4 bg-primary/10 rounded-2xl text-center">
        <p className="text-sm text-primary">
          Solo session — no debts to settle
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Settlement</h3>
      <div className="space-y-2">
        {settlementResult.transfers.map((t, i) => {
          const { roundedText, exactText, showExact } = formatVndWithExact(t.exactAmount, t.roundedAmount);
          return (
            <div key={i} className="flex items-baseline gap-1 text-sm">
              <span className="text-foreground">{t.fromPlayerName}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground">{t.toPlayerName}:</span>
              <span className="font-medium text-primary">
                {roundedText}
              </span>
              {showExact && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({exactText})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
