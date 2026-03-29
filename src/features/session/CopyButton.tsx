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
      className="w-full min-h-[44px] rounded-full font-bold text-sm transition-all duration-300 bg-primary text-primary-foreground shadow-soft hover:scale-105 hover:shadow-[0_6px_24px_-4px_rgba(93,112,82,0.25)] active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {isProcessing ? 'Saving...' : 'Save & Copy'}
    </button>
  );
}
