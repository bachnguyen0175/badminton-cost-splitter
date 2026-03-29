import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HistoryList } from '../features/history/HistoryList';
import { SessionDetail } from '../features/history/SessionDetail';
import { sessionService } from '../features/history/sessionService';
import type { SessionRecord } from '../core/types';

export default function HistoryScreen() {
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  const handleSelectSession = async (sessionId: string) => {
    const session = await sessionService.getSession(sessionId);
    if (session) {
      setSelectedSession(session);
      window.history.pushState({ sessionId }, '');
    }
  };

  const handleBack = useCallback(() => {
    setSelectedSession(null);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setSelectedSession(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (selectedSession) {
    return (
      <div className="relative min-h-screen p-4 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-72 h-72 rounded-organic bg-secondary/[0.05] blur-3xl animate-blob-drift-reverse" />
        </div>
        <div className="relative">
          <SessionDetail session={selectedSession} onBack={handleBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-organic bg-primary/[0.05] blur-3xl animate-blob-drift" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-organic bg-secondary/[0.05] blur-3xl animate-blob-drift-reverse" />
      </div>

      <header className="relative flex items-center justify-between mb-4">
        <Link to="/" className="p-2 text-primary min-w-[44px] min-h-[44px] flex items-center hover:text-primary/80 transition-colors duration-300" aria-label="Back to session">
          Back
        </Link>
        <h1 className="text-xl font-bold font-heading text-foreground">Session History</h1>
        <div className="w-[44px]" />
      </header>
      <div className="relative">
        <HistoryList onSelectSession={handleSelectSession} />
      </div>
    </div>
  );
}
