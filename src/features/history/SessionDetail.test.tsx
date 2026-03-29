import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionDetail } from './SessionDetail';
import type { SessionRecord } from '../../core/types';

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'session-1',
    date: new Date(2026, 2, 28),
    participants: [
      { id: 'p1', name: 'Bách' },
      { id: 'p2', name: 'Nam' },
      { id: 'p3', name: 'Huy' },
    ],
    costItems: [
      { label: 'Sân', amount: 300000 },
      { label: 'Cầu', amount: 80000 },
    ],
    totalCost: 380000,
    payers: [{ playerId: 'p1', playerName: 'Bách', amount: 380000 }],
    transfers: [
      {
        fromPlayerId: 'p2',
        fromPlayerName: 'Nam',
        toPlayerId: 'p1',
        toPlayerName: 'Bách',
        exactAmount: 126667,
        roundedAmount: 127000,
      },
      {
        fromPlayerId: 'p3',
        fromPlayerName: 'Huy',
        toPlayerId: 'p1',
        toPlayerName: 'Bách',
        exactAmount: 126667,
        roundedAmount: 127000,
      },
    ],
    note: 'Sân Tân Bình',
    ...overrides,
  };
}

describe('SessionDetail', () => {
  describe('Req 8.4 — Display all cost line items', () => {
    it('renders each cost item with label and formatted amount', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      // Cost item labels exist
      expect(screen.getByText('Sân')).toBeInTheDocument();
      expect(screen.getByText('Cầu')).toBeInTheDocument();
      // Cost item amounts exist (may appear in multiple sections)
      expect(screen.getAllByText(/300\.000/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/80\.000/).length).toBeGreaterThanOrEqual(1);
    });

    it('renders the total cost', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      expect(screen.getAllByText(/380\.000/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Req 8.4 — Display payer breakdown', () => {
    it('shows payer name and amount', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      // Payer section should exist with Bách and 380,000
      expect(screen.getAllByText(/380\.000/).length).toBeGreaterThanOrEqual(1);
    });

    it('shows multiple payers when present', () => {
      const session = makeSession({
        costItems: [{ label: 'Sân', amount: 380000 }],
        payers: [
          { playerId: 'p1', playerName: 'Bách', amount: 300000 },
          { playerId: 'p2', playerName: 'Nam', amount: 80000 },
        ],
      });

      render(<SessionDetail session={session} onBack={vi.fn()} />);

      // Both payer amounts present
      expect(screen.getAllByText(/300\.000/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/80\.000/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Req 8.4 — Display settlement transfers', () => {
    it('shows transfer results with rounded amounts', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      const transferTexts = screen.getAllByText(/127\.000/);
      expect(transferTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('shows exact amounts as sub-text when different from rounded', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      const exactTexts = screen.getAllByText(/126\.667/);
      expect(exactTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('does not show exact amount when it equals rounded amount', () => {
      const session = makeSession({
        transfers: [
          {
            fromPlayerId: 'p2',
            fromPlayerName: 'Nam',
            toPlayerId: 'p1',
            toPlayerName: 'Bách',
            exactAmount: 100000,
            roundedAmount: 100000,
          },
        ],
      });

      render(<SessionDetail session={session} onBack={vi.fn()} />);

      expect(screen.queryByText(/exact/i)).not.toBeInTheDocument();
    });

    it('shows transfer direction (from → to)', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      expect(screen.getByText(/Nam.*→.*Bách/)).toBeInTheDocument();
      expect(screen.getByText(/Huy.*→.*Bách/)).toBeInTheDocument();
    });
  });

  describe('Req 8.4 — Display session note', () => {
    it('displays the note when present', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      expect(screen.getByText('Sân Tân Bình')).toBeInTheDocument();
    });

    it('does not render a note section when note is null', () => {
      const session = makeSession({ note: null });
      render(<SessionDetail session={session} onBack={vi.fn()} />);

      // The note "Sân Tân Bình" should not appear
      expect(screen.queryByText('Sân Tân Bình')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders a back button', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
      const onBack = vi.fn();
      const user = userEvent.setup();

      render(<SessionDetail session={makeSession()} onBack={onBack} />);

      await user.click(screen.getByRole('button', { name: /back/i }));

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Header information', () => {
    it('displays the session date', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      expect(screen.getByText(/28\/03\/2026/)).toBeInTheDocument();
    });

    it('displays participant names', () => {
      render(<SessionDetail session={makeSession()} onBack={vi.fn()} />);

      expect(screen.getByText(/Bách.*Nam.*Huy/)).toBeInTheDocument();
    });
  });
});
