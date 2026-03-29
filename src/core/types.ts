export type Result<T, E extends string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface Player {
  id: string;
  name: string;
  createdAt: Date;
}

export interface CostItem {
  id: string;
  label: string;
  amount: number | null;
}

export interface PayerEntry {
  playerId: string;
  amount: number | null;
}

export interface Transfer {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  exactAmount: number;
  roundedAmount: number;
}

export interface SettlementInput {
  participants: Array<{ id: string; name: string }>;
  totalCost: number;
  payers: Array<{ playerId: string; amount: number }>;
}

export interface SettlementResult {
  transfers: Transfer[];
  isSoloSession: boolean;
}

export interface SessionRecord {
  id: string;
  date: Date;
  participants: Array<{ id: string; name: string }>;
  costItems: Array<{ label: string; amount: number }>;
  totalCost: number;
  payers: Array<{ playerId: string; playerName: string; amount: number }>;
  transfers: Transfer[];
  note: string | null;
}
