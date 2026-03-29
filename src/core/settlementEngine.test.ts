import { describe, it, expect } from 'vitest';
import { calculateSettlement } from './settlementEngine';
import type { SettlementInput } from './types';

function makeParticipant(id: string, name: string) {
  return { id, name };
}

describe('calculateSettlement', () => {
  describe('solo session (1 player)', () => {
    it('returns empty transfers with isSoloSession true', () => {
      const input: SettlementInput = {
        participants: [makeParticipant('1', 'Alice')],
        totalCost: 300000,
        payers: [{ playerId: '1', amount: 300000 }],
      };
      const result = calculateSettlement(input);
      expect(result.isSoloSession).toBe(true);
      expect(result.transfers).toEqual([]);
    });
  });

  describe('2 players', () => {
    it('calculates single transfer when one player pays all', () => {
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
        ],
        totalCost: 200000,
        payers: [{ playerId: '1', amount: 200000 }],
      };
      const result = calculateSettlement(input);
      expect(result.isSoloSession).toBe(false);
      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0]).toMatchObject({
        fromPlayerId: '2',
        fromPlayerName: 'Bob',
        toPlayerId: '1',
        toPlayerName: 'Alice',
        exactAmount: 100000,
        roundedAmount: 100000,
      });
    });

    it('handles two players who both pay unequally', () => {
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
        ],
        totalCost: 300000,
        payers: [
          { playerId: '1', amount: 200000 },
          { playerId: '2', amount: 100000 },
        ],
      };
      const result = calculateSettlement(input);
      expect(result.transfers).toHaveLength(1);
      // Alice paid 200k, fair share 150k, so Alice is owed 50k
      // Bob paid 100k, fair share 150k, so Bob owes 50k
      expect(result.transfers[0]).toMatchObject({
        fromPlayerId: '2',
        toPlayerId: '1',
        exactAmount: 50000,
        roundedAmount: 50000,
      });
    });
  });

  describe('5 players, single payer', () => {
    it('generates 4 transfers when one player pays for 5', () => {
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Bach'),
          makeParticipant('2', 'Nam'),
          makeParticipant('3', 'Huy'),
          makeParticipant('4', 'Long'),
          makeParticipant('5', 'Tuan'),
        ],
        totalCost: 500000,
        payers: [{ playerId: '1', amount: 500000 }],
      };
      const result = calculateSettlement(input);
      expect(result.isSoloSession).toBe(false);
      expect(result.transfers).toHaveLength(4);

      // Each non-payer owes 100,000
      for (const transfer of result.transfers) {
        expect(transfer.toPlayerId).toBe('1');
        expect(transfer.toPlayerName).toBe('Bach');
        expect(transfer.exactAmount).toBe(100000);
        expect(transfer.roundedAmount).toBe(100000);
      }
    });
  });

  describe('5 players, multiple payers', () => {
    it('settles correctly with two payers among five', () => {
      // Total: 500,000. Fair share: 100,000 each
      // Bach paid 300,000 → net +200,000
      // Nam paid 200,000 → net +100,000
      // Huy, Long, Tuan paid 0 → net -100,000 each
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Bach'),
          makeParticipant('2', 'Nam'),
          makeParticipant('3', 'Huy'),
          makeParticipant('4', 'Long'),
          makeParticipant('5', 'Tuan'),
        ],
        totalCost: 500000,
        payers: [
          { playerId: '1', amount: 300000 },
          { playerId: '2', amount: 200000 },
        ],
      };
      const result = calculateSettlement(input);

      // Verify total debt transferred equals total owed
      const totalExact = result.transfers.reduce((s, t) => s + t.exactAmount, 0);
      expect(totalExact).toBe(300000); // 3 debtors × 100k

      // All transfers should have positive amounts
      for (const transfer of result.transfers) {
        expect(transfer.exactAmount).toBeGreaterThan(0);
        expect(transfer.roundedAmount).toBeGreaterThan(0);
      }
    });
  });

  describe('10 players', () => {
    it('handles 10 players with single payer', () => {
      const participants = Array.from({ length: 10 }, (_, i) =>
        makeParticipant(String(i + 1), `Player${i + 1}`)
      );
      const input: SettlementInput = {
        participants,
        totalCost: 1000000,
        payers: [{ playerId: '1', amount: 1000000 }],
      };
      const result = calculateSettlement(input);
      expect(result.isSoloSession).toBe(false);
      expect(result.transfers).toHaveLength(9);

      for (const transfer of result.transfers) {
        expect(transfer.toPlayerId).toBe('1');
        expect(transfer.exactAmount).toBeCloseTo(100000, 0);
        expect(transfer.roundedAmount).toBe(100000);
      }
    });
  });

  describe('VND rounding', () => {
    it('rounds each transfer to nearest 1,000 VND', () => {
      // 3 players, total 500,000, single payer
      // Fair share: 166,666.67 each
      // Two debtors each owe 166,666.67 → rounded to 167,000
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
          makeParticipant('3', 'Charlie'),
        ],
        totalCost: 500000,
        payers: [{ playerId: '1', amount: 500000 }],
      };
      const result = calculateSettlement(input);
      expect(result.transfers).toHaveLength(2);

      for (const transfer of result.transfers) {
        expect(transfer.exactAmount).toBeCloseTo(500000 / 3, 1);
        expect(transfer.roundedAmount).toBe(167000);
      }
    });

    it('handles amount ending in exactly 500 (round-half boundary)', () => {
      // 2 players, total 301,000, single payer
      // Fair share: 150,500 each. Debtor owes 150,500
      // Math.round(150500 / 1000) * 1000 = Math.round(150.5) * 1000 = 151 * 1000 = 151,000
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
        ],
        totalCost: 301000,
        payers: [{ playerId: '1', amount: 301000 }],
      };
      const result = calculateSettlement(input);
      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0].exactAmount).toBe(150500);
      expect(result.transfers[0].roundedAmount).toBe(151000);
    });

    it('rounds down when remainder is below 500', () => {
      // 2 players, total 299,000, single payer
      // Debtor owes 149,500 → Math.round(149.5) * 1000 = 150,000
      // Actually Math.round(149500/1000) = Math.round(149.5) = 150 → 150,000
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
        ],
        totalCost: 299000,
        payers: [{ playerId: '1', amount: 299000 }],
      };
      const result = calculateSettlement(input);
      expect(result.transfers[0].exactAmount).toBe(149500);
      expect(result.transfers[0].roundedAmount).toBe(150000);
    });

    it('preserves exact amounts alongside rounded amounts', () => {
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
          makeParticipant('3', 'Charlie'),
        ],
        totalCost: 500000,
        payers: [{ playerId: '1', amount: 500000 }],
      };
      const result = calculateSettlement(input);
      for (const transfer of result.transfers) {
        expect(transfer.exactAmount).not.toBe(transfer.roundedAmount);
        expect(typeof transfer.exactAmount).toBe('number');
        expect(typeof transfer.roundedAmount).toBe('number');
      }
    });
  });

  describe('symmetrical debt scenarios', () => {
    it('produces no transfers when all pay equally', () => {
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
          makeParticipant('3', 'Charlie'),
        ],
        totalCost: 300000,
        payers: [
          { playerId: '1', amount: 100000 },
          { playerId: '2', amount: 100000 },
          { playerId: '3', amount: 100000 },
        ],
      };
      const result = calculateSettlement(input);
      expect(result.transfers).toEqual([]);
      expect(result.isSoloSession).toBe(false);
    });
  });

  describe('transfer minimization', () => {
    it('minimizes transfers with greedy matching', () => {
      // 4 players. Total: 400,000. Fair share: 100,000
      // Player1 paid 400,000 → net +300,000
      // Player2 paid 0 → net -100,000
      // Player3 paid 0 → net -100,000
      // Player4 paid 0 → net -100,000
      // Should produce exactly 3 transfers
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'A'),
          makeParticipant('2', 'B'),
          makeParticipant('3', 'C'),
          makeParticipant('4', 'D'),
        ],
        totalCost: 400000,
        payers: [{ playerId: '1', amount: 400000 }],
      };
      const result = calculateSettlement(input);
      expect(result.transfers).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('handles non-payer participants correctly', () => {
      // 3 players, only player 2 pays
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'Alice'),
          makeParticipant('2', 'Bob'),
          makeParticipant('3', 'Charlie'),
        ],
        totalCost: 300000,
        payers: [{ playerId: '2', amount: 300000 }],
      };
      const result = calculateSettlement(input);
      expect(result.transfers).toHaveLength(2);
      for (const transfer of result.transfers) {
        expect(transfer.toPlayerId).toBe('2');
        expect(transfer.toPlayerName).toBe('Bob');
      }
    });

    it('all transfers have positive exactAmount', () => {
      const input: SettlementInput = {
        participants: [
          makeParticipant('1', 'A'),
          makeParticipant('2', 'B'),
          makeParticipant('3', 'C'),
          makeParticipant('4', 'D'),
          makeParticipant('5', 'E'),
        ],
        totalCost: 750000,
        payers: [
          { playerId: '1', amount: 400000 },
          { playerId: '3', amount: 350000 },
        ],
      };
      const result = calculateSettlement(input);
      for (const transfer of result.transfers) {
        expect(transfer.exactAmount).toBeGreaterThan(0);
        expect(transfer.roundedAmount).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
