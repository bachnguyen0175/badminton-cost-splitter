import { useState, useCallback } from 'react';
import type { SessionRecord } from '../../core/types';
import { sessionService } from '../history/sessionService';
import { copySettlementSummary } from '../../core/clipboardService';

interface NewSessionButtonProps {
  hasValidSettlement: boolean;
  isPersisted: boolean;
  sessionData?: Omit<SessionRecord, 'id'>;
  onReset: () => void;
  onPersisted: () => void;
  onCopied: () => void;
  onToast: (message: string) => void;
  onClipboardFallback: (text: string) => void;
}

export function NewSessionButton({
  hasValidSettlement,
  isPersisted,
  sessionData,
  onReset,
  onPersisted,
  onCopied,
  onToast,
  onClipboardFallback,
}: NewSessionButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(() => {
    if (!hasValidSettlement || isPersisted) {
      onReset();
      return;
    }
    setShowDialog(true);
  }, [hasValidSettlement, isPersisted, onReset]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  const handleDiscard = useCallback(() => {
    setShowDialog(false);
    onReset();
  }, [onReset]);

  const handleSaveOnly = useCallback(async () => {
    if (!sessionData || isProcessing) return;
    setIsProcessing(true);
    try {
      await sessionService.saveSession(sessionData);
      onPersisted();
      onToast('Session saved');
      setShowDialog(false);
      onReset();
    } finally {
      setIsProcessing(false);
    }
  }, [sessionData, isProcessing, onPersisted, onToast, onReset]);

  const handleSaveAndCopy = useCallback(async () => {
    if (!sessionData || isProcessing) return;
    setIsProcessing(true);
    try {
      await sessionService.saveSession(sessionData);
      onPersisted();

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
        onToast('Saved & Copied');
      } else {
        onToast('Session saved');
        onClipboardFallback(result.text);
      }

      setShowDialog(false);
      onReset();
    } finally {
      setIsProcessing(false);
    }
  }, [sessionData, isProcessing, onPersisted, onCopied, onToast, onClipboardFallback, onReset]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-full min-h-[44px] rounded-full font-medium text-sm transition-all duration-300 border-2 border-secondary text-secondary bg-transparent hover:bg-secondary/10 hover:scale-105 active:scale-95"
      >
        New Session
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            className="mx-4 w-full max-w-sm rounded-[2rem] bg-background p-6 shadow-float border border-border/50"
          >
            <h2 className="mb-3 text-base font-semibold text-foreground font-heading">
              Unsaved session
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              You have unsaved settlement results. What would you like to do?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveAndCopy}
                className="min-h-[44px] rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-soft hover:scale-105 active:scale-95 transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Save & Copy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveOnly}
                className="min-h-[44px] rounded-full bg-secondary text-sm font-bold text-secondary-foreground hover:scale-105 active:scale-95 transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Save Only
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDiscard}
                className="min-h-[44px] rounded-full bg-destructive/10 text-sm font-medium text-destructive hover:bg-destructive/20 hover:scale-105 active:scale-95 transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCancel}
                className="min-h-[44px] rounded-full bg-muted text-sm font-medium text-accent-foreground hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
