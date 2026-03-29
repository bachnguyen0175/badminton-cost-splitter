import { useState } from 'react';
import { useSessionList } from './useSessionList';
import { sessionService } from './sessionService';
import { formatVnd } from '../../core/vndFormat';

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface HistoryListProps {
  onSelectSession: (sessionId: string) => void;
}

export function HistoryList({ onSelectSession }: HistoryListProps) {
  const sessions = useSessionList();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteTargetId) {
      await sessionService.deleteSession(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  if (sessions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No sessions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const radiusVariants = ['rounded-card-1', 'rounded-card-2', 'rounded-card-3', 'rounded-card-4', 'rounded-card-5', 'rounded-card-6'];
        const radius = radiusVariants[index % radiusVariants.length];
        const rotateHover = index % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1';
        return (
        <article
          key={session.id}
          className={`bg-[#FEFEFA] ${radius} shadow-soft border border-border/50 p-4 cursor-pointer hover:-translate-y-1 ${rotateHover} hover:shadow-soft-hover active:scale-[0.98] transition-all duration-300`}
          onClick={() => onSelectSession(session.id)}
          role="article"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {formatDate(session.date)}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {formatVnd(session.totalCost)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {session.participants.map((p) => p.name).join(', ')}
              </p>
            </div>
            <button
              type="button"
              aria-label="Delete"
              className="ml-2 p-2 text-muted-foreground hover:text-destructive transition-colors duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTargetId(session.id);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </article>
        );
      })}

      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-[2rem] p-6 max-w-sm w-full shadow-float border border-border/50">
            <p className="text-foreground mb-4">Are you sure you want to delete this session?</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                aria-label="Cancel"
                className="px-6 py-2 text-sm font-medium text-accent-foreground bg-muted rounded-full hover:bg-muted/80 hover:scale-105 active:scale-95 min-h-[44px] transition-all duration-300"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                aria-label="Confirm"
                className="px-6 py-2 text-sm font-medium text-white bg-destructive rounded-full hover:bg-destructive/90 hover:scale-105 active:scale-95 min-h-[44px] transition-all duration-300"
                onClick={handleDelete}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
