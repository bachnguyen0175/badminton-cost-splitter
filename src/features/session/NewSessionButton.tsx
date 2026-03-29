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
        className="w-full min-h-[44px] rounded-lg font-medium text-sm transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        New Session
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            className="mx-4 w-full max-w-sm rounded-lg bg-white p-5 shadow-lg"
          >
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              Unsaved session
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              You have unsaved settlement results. What would you like to do?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveAndCopy}
                className="min-h-[44px] rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Save & Copy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSaveOnly}
                className="min-h-[44px] rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Save Only
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDiscard}
                className="min-h-[44px] rounded-lg bg-red-100 text-sm font-medium text-red-700 hover:bg-red-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCancel}
                className="min-h-[44px] rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
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
