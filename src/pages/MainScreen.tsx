import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerList } from '../features/players/usePlayerList';
import { PlayerManager } from '../features/players/PlayerManager';
import { useSessionForm } from '../features/session/useSessionForm';
import { useSessionDerived } from '../features/session/useSessionDerived';
import { PlayerSelector } from '../features/session/PlayerSelector';
import { CostInputPanel } from '../features/session/CostInputPanel';
import { SessionNoteInput } from '../features/session/SessionNoteInput';
import { PayerPanel } from '../features/session/PayerPanel';
import { SettlementDisplay } from '../features/session/SettlementDisplay';
import { CopyButton } from '../features/session/CopyButton';
import { NewSessionButton } from '../features/session/NewSessionButton';
import { ClipboardFallbackModal } from '../features/session/ClipboardFallbackModal';
import type { SessionRecord } from '../core/types';

export default function MainScreen() {
  const players = usePlayerList();
  const { state, actions } = useSessionForm(players);

  const participants = useMemo(
    () =>
      players
        .filter(p => state.selectedPlayerIds.has(p.id))
        .map(p => ({ id: p.id, name: p.name })),
    [players, state.selectedPlayerIds]
  );

  const derived = useSessionDerived(state, participants);

  const [showPlayerManager, setShowPlayerManager] = useState(false);
  const [clipboardFallbackText, setClipboardFallbackText] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Build sessionData for CopyButton and NewSessionButton
  const sessionData: Omit<SessionRecord, 'id'> | undefined = useMemo(() => {
    if (!derived.hasValidSettlement || !derived.settlementResult) return undefined;
    return {
      date: new Date(),
      participants,
      costItems: state.costItems
        .filter(i => i.amount !== null && i.amount > 0)
        .map(i => ({ label: i.label || 'Unnamed', amount: i.amount! })),
      totalCost: derived.totalCost,
      payers: state.payerEntries
        .filter((e): e is { playerId: string; amount: number } => e.amount !== null)
        .map(e => {
          const player = players.find(p => p.id === e.playerId);
          return { playerId: e.playerId, playerName: player?.name ?? '', amount: e.amount };
        }),
      transfers: derived.settlementResult.transfers,
      note: state.sessionNote || null,
    };
  }, [derived, state.costItems, state.payerEntries, state.sessionNote, participants, players]);

  // Auto-dismiss reconciliation toast
  useEffect(() => {
    if (state.toastMessage) {
      const timer = setTimeout(() => actions.dismissToast(), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage, actions]);

  // Auto-dismiss action toast
  useEffect(() => {
    if (actionToast) {
      const timer = setTimeout(() => setActionToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionToast]);

  const displayedToast = state.toastMessage || actionToast;

  const hasParticipants = state.selectedPlayerIds.size > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Badminton Cost Splitter</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPlayerManager(true)}
            className="p-2 min-w-[44px] min-h-[44px] text-gray-600 hover:text-gray-900"
            aria-label="Manage players"
          >
            Players
          </button>
          <Link
            to="/history"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center text-blue-600"
            aria-label="View history"
          >
            History
          </Link>
        </div>
      </header>

      <div className="space-y-4">
        <PlayerSelector
          players={players}
          selectedPlayerIds={state.selectedPlayerIds}
          onTogglePlayer={actions.togglePlayer}
          onSelectAll={actions.selectAllPlayers}
          onDeselectAll={actions.deselectAllPlayers}
        />

        {hasParticipants ? (
          <>
            <CostInputPanel
              costItems={state.costItems}
              totalCost={derived.totalCost}
              onAddCostItem={actions.addCostItem}
              onUpdateCostItem={actions.updateCostItem}
              onRemoveCostItem={actions.removeCostItem}
            />

            <SessionNoteInput
              value={state.sessionNote}
              onChange={actions.setSessionNote}
            />

            <PayerPanel
              participants={participants}
              selectedPayerIds={state.selectedPayerIds}
              payerEntries={state.payerEntries}
              totalCost={derived.totalCost}
              payerTotal={derived.payerTotal}
              isPayerAmountValid={derived.isPayerAmountValid}
              onTogglePayer={actions.togglePayer}
              onUpdatePayerAmount={actions.updatePayerAmount}
            />

            <SettlementDisplay settlementResult={derived.settlementResult} />

            <div className="space-y-2">
              <CopyButton
                hasValidSettlement={derived.hasValidSettlement}
                isPersisted={state.isPersisted}
                sessionData={sessionData}
                onPersisted={actions.markPersisted}
                onCopied={actions.markCopied}
                onClipboardFallback={setClipboardFallbackText}
                onToast={setActionToast}
              />

              <NewSessionButton
                hasValidSettlement={derived.hasValidSettlement}
                isPersisted={state.isPersisted}
                sessionData={sessionData}
                onReset={actions.resetSession}
                onPersisted={actions.markPersisted}
                onCopied={actions.markCopied}
                onToast={setActionToast}
                onClipboardFallback={setClipboardFallbackText}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Please select players before calculating
          </p>
        )}
      </div>

      <PlayerManager
        isOpen={showPlayerManager}
        onClose={() => setShowPlayerManager(false)}
      />

      <ClipboardFallbackModal
        text={clipboardFallbackText}
        onClose={() => setClipboardFallbackText(null)}
      />

      {displayedToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
          {displayedToast}
        </div>
      )}
    </div>
  );
}
