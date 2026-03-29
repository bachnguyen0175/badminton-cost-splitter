import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/db';
import type { Player } from '../../core/types';

export function usePlayerList(): Player[] {
  const players = useLiveQuery(() => db.players.toArray());
  return players ?? [];
}
