import { useState, useCallback } from 'react';
import type { SessionRecord } from '../../core/types';
import { sessionService } from '../history/sessionService';
import { copySettlementSummary } from '../../core/clipboardService';

interface CopyButtonProps {
  hasValidSettlement: boolean;
  isPersisted: boolean;
  sessionData?: Omit<SessionRecord, 'id'>;
  onPersisted: () => void;
  onCopied: () => void;
  onClipboardFallback: (text: string) => void;
  onToast: (message: string) => void;
}

export function CopyButton({
  hasValidSettlement,
  isPersisted,
  sessionData,
  onPersisted,
  onCopied,
  onClipboardFallback,
  onToast,
}: CopyButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(async () => {
    if (!sessionData || isProcessing) return;

    setIsProcessing(true);
    try {
      let wasPersisted = isPersisted;

      if (!isPersisted) {
        await sessionService.saveSession(sessionData);
        onPersisted();
        wasPersisted = true;
      }

      const result = await copySettlementSummary(
        sessionData.transfers,
        sessionData.totalCost,
        sessionData.costItems,
        sessionData.participants,
        sessionData.note,
        sessionData.date
      );

      if (result.success) {
        onCopied();
        onToast(wasPersisted && isPersisted ? 'Copied' : 'Saved & Copied');
      } else {
        if (wasPersisted && !isPersisted) {
          onToast('Session saved');
        }
        onClipboardFallback(result.text);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [sessionData, isPersisted, isProcessing, onPersisted, onCopied, onClipboardFallback, onToast]);

  return (
    <button
      type="button"
      disabled={!hasValidSettlement || isProcessing}
      onClick={handleClick}
      className="w-full min-h-[44px] rounded-lg font-medium text-sm transition-colors bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
    >
      {isProcessing ? 'Saving...' : 'Save & Copy'}
    </button>
  );
}
