import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/db';
import type { SessionRecord } from '../../core/types';

export function useSessionList(): SessionRecord[] {
  const sessions = useLiveQuery(() =>
    db.sessions.orderBy('date').reverse().toArray()
  );
  return sessions ?? [];
}
