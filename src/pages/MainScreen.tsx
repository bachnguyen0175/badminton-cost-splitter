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
    <div className="relative min-h-screen p-4 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-organic bg-primary/[0.06] blur-3xl animate-blob-drift" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-organic bg-secondary/[0.06] blur-3xl animate-blob-drift-reverse" />
      </div>

      <header className="relative flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold font-heading text-foreground">Badminton Cost Splitter</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPlayerManager(true)}
            className="p-2 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground transition-colors duration-300"
            aria-label="Manage players"
          >
            Players
          </button>
          <Link
            to="/history"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center text-primary hover:text-primary/80 transition-colors duration-300"
            aria-label="View history"
          >
            History
          </Link>
        </div>
      </header>

      <div className="relative space-y-5">
        <section className="bg-[#FEFEFA] rounded-card-1 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
          <PlayerSelector
            players={players}
            selectedPlayerIds={state.selectedPlayerIds}
            onTogglePlayer={actions.togglePlayer}
            onSelectAll={actions.selectAllPlayers}
            onDeselectAll={actions.deselectAllPlayers}
          />
        </section>

        {hasParticipants ? (
          <>
            <section className="bg-[#FEFEFA] rounded-card-2 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
              <CostInputPanel
                costItems={state.costItems}
                totalCost={derived.totalCost}
                onAddCostItem={actions.addCostItem}
                onUpdateCostItem={actions.updateCostItem}
                onRemoveCostItem={actions.removeCostItem}
              />

              <div className="mt-4">
                <SessionNoteInput
                  value={state.sessionNote}
                  onChange={actions.setSessionNote}
                />
              </div>
            </section>

            <section className="bg-[#FEFEFA] rounded-card-3 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
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
            </section>

            {derived.settlementResult && (
              <section className="bg-[#FEFEFA] rounded-card-4 shadow-soft border border-border/50 p-5 transition-all duration-300 hover:shadow-soft-hover">
                <SettlementDisplay settlementResult={derived.settlementResult} />
              </section>
            )}

            <div className="space-y-3">
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
          <p className="text-sm text-muted-foreground text-center py-8">
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-foreground text-primary-foreground text-sm rounded-full shadow-float">
          {displayedToast}
        </div>
      )}
    </div>
  );
}
