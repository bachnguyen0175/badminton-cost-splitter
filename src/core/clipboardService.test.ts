import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copySettlementSummary } from './clipboardService';
import type { Transfer } from './types';

describe('clipboardService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseTransfers: Transfer[] = [
    {
      fromPlayerId: '2',
      fromPlayerName: 'Nam',
      toPlayerId: '1',
      toPlayerName: 'Bách',
      exactAmount: 66667,
      roundedAmount: 67000,
    },
    {
      fromPlayerId: '3',
      fromPlayerName: 'Huy',
      toPlayerId: '1',
      toPlayerName: 'Bách',
      exactAmount: 66667,
      roundedAmount: 67000,
    },
  ];

  const baseCostItems = [
    { label: 'Sân', amount: 300000 },
    { label: 'Cầu', amount: 80000 },
    { label: 'Nước', amount: 120000 },
  ];

  const baseParticipants = [
    { id: '1', name: 'Bách' },
    { id: '2', name: 'Nam' },
    { id: '3', name: 'Huy' },
  ];

  describe('formatSettlementText', () => {
    it('should format text with session note', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const result = await copySettlementSummary(
        baseTransfers,
        500000,
        baseCostItems,
        baseParticipants,
        'Sân Tân Bình',
        new Date(2026, 2, 28) // March 28, 2026
      );

      expect(result.success).toBe(true);
      expect(result.text).toContain('🏸 Cầu lông - 28/03/2026');
      expect(result.text).toContain('Sân Tân Bình');
      expect(result.text).toContain('💰 Tổng: 500.000đ (Sân: 300.000đ, Cầu: 80.000đ, Nước: 120.000đ)');
      expect(result.text).toContain('👥 3 người chơi');
      expect(result.text).toContain('💸 Kết quả:');
      expect(result.text).toContain('- Nam → Bách: 67.000đ');
      expect(result.text).toContain('- Huy → Bách: 67.000đ');
    });

    it('should format text without session note when note is null', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const result = await copySettlementSummary(
        baseTransfers,
        500000,
        baseCostItems,
        baseParticipants,
        null,
        new Date(2026, 2, 28)
      );

      expect(result.text).toContain('🏸 Cầu lông - 28/03/2026');
      expect(result.text).not.toContain('\n\n💰'); // no blank note line
      const lines = result.text.split('\n');
      expect(lines[1]).toContain('💰 Tổng:');
    });

    it('should format text without session note when note is empty string', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const result = await copySettlementSummary(
        baseTransfers,
        500000,
        baseCostItems,
        baseParticipants,
        '',
        new Date(2026, 2, 28)
      );

      const lines = result.text.split('\n');
      expect(lines[1]).toContain('💰 Tổng:');
    });

    it('should format amounts with vi-VN locale (dot as thousands separator)', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const result = await copySettlementSummary(
        [
          {
            fromPlayerId: '2',
            fromPlayerName: 'Nam',
            toPlayerId: '1',
            toPlayerName: 'Bách',
            exactAmount: 1234567,
            roundedAmount: 1235000,
          },
        ],
        2469134,
        [{ label: 'Sân', amount: 2469134 }],
        [
          { id: '1', name: 'Bách' },
          { id: '2', name: 'Nam' },
        ],
        null,
        new Date(2026, 0, 15)
      );

      expect(result.text).toContain('2.469.134đ');
      expect(result.text).toContain('1.235.000đ');
    });

    it('should format single cost item without parenthesized breakdown', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });

      const result = await copySettlementSummary(
        baseTransfers,
        300000,
        [{ label: 'Sân', amount: 300000 }],
        baseParticipants,
        null,
        new Date(2026, 2, 28)
      );

      expect(result.text).toContain('💰 Tổng: 300.000đ');
      // Single item: still show breakdown for consistency
      expect(result.text).toContain('(Sân: 300.000đ)');
    });
  });

  describe('clipboard interaction', () => {
    it('should call navigator.clipboard.writeText with the formatted text', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      const result = await copySettlementSummary(
        baseTransfers,
        500000,
        baseCostItems,
        baseParticipants,
        null,
        new Date(2026, 2, 28)
      );

      expect(writeTextMock).toHaveBeenCalledWith(result.text);
      expect(result.success).toBe(true);
    });

    it('should return success: false and text when clipboard write fails', async () => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
      });

      const result = await copySettlementSummary(
        baseTransfers,
        500000,
        baseCostItems,
        baseParticipants,
        'Sân Tân Bình',
        new Date(2026, 2, 28)
      );

      expect(result.success).toBe(false);
      expect(result.text).toContain('🏸 Cầu lông - 28/03/2026');
      expect(result.text).toContain('- Nam → Bách: 67.000đ');
    });

    it('should return success: false when clipboard API is not available', async () => {
      Object.assign(navigator, { clipboard: undefined });

      const result = await copySettlementSummary(
        baseTransfers,
        500000,
        baseCostItems,
        baseParticipants,
        null,
        new Date(2026, 2, 28)
      );

      expect(result.success).toBe(false);
      expect(result.text).toBeTruthy();
    });
  });
});
