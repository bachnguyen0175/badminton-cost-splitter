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
          className="p-2 text-blue-600 min-w-[44px] min-h-[44px] flex items-center"
          onClick={onBack}
        >
          &larr; Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {formatDate(session.date)}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {formatVnd(session.totalCost)}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {session.participants.map((p) => p.name).join(', ')}
        </p>
      </div>

      {session.note && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Note</h3>
          <p className="text-sm text-gray-600">{session.note}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Cost Items</h3>
        <ul className="space-y-1">
          {session.costItems.map((item, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-gray-900">{item.label}</span>
              <span className="text-gray-700">{formatVnd(item.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Payers</h3>
        <ul className="space-y-1">
          {session.payers.map((payer) => (
            <li key={payer.playerId} className="flex justify-between text-sm">
              <span className="text-gray-900">{payer.playerName}</span>
              <span className="text-gray-700">{formatVnd(payer.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      {session.transfers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Settlement</h3>
          <ul className="space-y-2">
            {session.transfers.map((transfer, i) => (
              <li key={i} className="text-sm">
                <div className="text-gray-900">
                  {transfer.fromPlayerName} → {transfer.toPlayerName}: {formatVnd(transfer.roundedAmount)}
                </div>
                {transfer.roundedAmount !== transfer.exactAmount && (
                  <div className="text-xs text-gray-400">
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
