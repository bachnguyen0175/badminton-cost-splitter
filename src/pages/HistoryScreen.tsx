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
      <div className="min-h-screen bg-gray-50 p-4 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto">
        <SessionDetail session={selectedSession} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <Link to="/" className="p-2 text-blue-600 min-w-[44px] min-h-[44px] flex items-center" aria-label="Back to session">
          Back
        </Link>
        <h1 className="text-xl font-bold">Session History</h1>
        <div className="w-[44px]" />
      </header>
      <HistoryList onSelectSession={handleSelectSession} />
    </div>
  );
}
