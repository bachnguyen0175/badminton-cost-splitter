import type { SessionRecord } from '../../core/types';
import { formatVnd } from '../../core/vndFormat';

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface SessionDetailProps {
  session: SessionRecord;
  onBack: () => void;
}

export function SessionDetail({ session, onBack }: SessionDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          aria-label="Back"
          className="p-2 text-primary min-w-[44px] min-h-[44px] flex items-center hover:text-primary/80 transition-colors duration-300"
          onClick={onBack}
        >
          &larr; Back
        </button>
      </div>

      <div className="bg-[#FEFEFA] rounded-card-1 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {formatDate(session.date)}
          </span>
          <span className="text-sm font-semibold text-primary">
            {formatVnd(session.totalCost)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {session.participants.map((p) => p.name).join(', ')}
        </p>
      </div>

      {session.note && (
        <div className="bg-[#FEFEFA] rounded-card-5 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
          <h3 className="text-sm font-semibold text-foreground mb-1">Note</h3>
          <p className="text-sm text-muted-foreground">{session.note}</p>
        </div>
      )}

      <div className="bg-[#FEFEFA] rounded-card-2 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
        <h3 className="text-sm font-semibold text-foreground mb-2">Cost Items</h3>
        <ul className="space-y-1">
          {session.costItems.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-foreground">{item.label}</span>
              <span className="text-muted-foreground">{formatVnd(item.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#FEFEFA] rounded-card-3 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
        <h3 className="text-sm font-semibold text-foreground mb-2">Payers</h3>
        <ul className="space-y-1">
          {session.payers.map((payer) => (
            <li key={payer.playerId} className="flex justify-between text-sm">
              <span className="text-foreground">{payer.playerName}</span>
              <span className="text-muted-foreground">{formatVnd(payer.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      {session.transfers.length > 0 && (
        <div className="bg-[#FEFEFA] rounded-card-4 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
          <h3 className="text-sm font-semibold text-foreground mb-2">Settlement</h3>
          <ul className="space-y-2">
            {session.transfers.map((transfer, i) => (
              <li key={i} className="text-sm">
                <div className="text-foreground">
                  {transfer.fromPlayerName} → {transfer.toPlayerName}: {formatVnd(transfer.roundedAmount)}
                </div>
                {transfer.roundedAmount !== transfer.exactAmount && (
                  <div className="text-xs text-muted-foreground">
                    Exact: {formatVnd(transfer.exactAmount)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
