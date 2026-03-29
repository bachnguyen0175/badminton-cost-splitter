import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettlementDisplay } from './SettlementDisplay';
import type { SettlementResult } from '../../core/types';

describe('SettlementDisplay', () => {
  describe('Req 6.1 — Display settlement transfers when inputs are valid', () => {
    it('renders transfer results when settlementResult is provided', () => {
      const result: SettlementResult = {
        transfers: [
          {
            fromPlayerId: 'p1',
            fromPlayerName: 'Nam',
            toPlayerId: 'p2',
            toPlayerName: 'Bách',
            exactAmount: 166667,
            roundedAmount: 167000,
          },
        ],
        isSoloSession: false,
      };
      render(<SettlementDisplay settlementResult={result} />);
      expect(screen.getByText(/Nam/)).toBeInTheDocument();
      expect(screen.getByText(/Bách/)).toBeInTheDocument();
    });

    it('renders nothing when settlementResult is null', () => {
      const { container } = render(<SettlementDisplay settlementResult={null} />);
      expect(container.textContent).toBe('');
    });
  });

  describe('Req 6.2 — Display rounded amounts (nearest 1,000 VND)', () => {
    it('displays rounded amounts for each transfer', () => {
      const result: SettlementResult = {
        transfers: [
          {
            fromPlayerId: 'p1',
            fromPlayerName: 'Nam',
            toPlayerId: 'p2',
            toPlayerName: 'Bách',
            exactAmount: 166667,
            roundedAmount: 167000,
          },
        ],
        isSoloSession: false,
      };
      render(<SettlementDisplay settlementResult={result} />);
      expect(screen.getByText(/167[,.]000/)).toBeInTheDocument();
    });

    it('displays multiple transfers', () => {
      const result: SettlementResult = {
        transfers: [
          {
            fromPlayerId: 'p1',
            fromPlayerName: 'Nam',
            toPlayerId: 'p3',
            toPlayerName: 'Bách',
            exactAmount: 100000,
            roundedAmount: 100000,
          },
          {
            fromPlayerId: 'p2',
            fromPlayerName: 'Huy',
            toPlayerId: 'p3',
            toPlayerName: 'Bách',
            exactAmount: 100000,
            roundedAmount: 100000,
          },
        ],
        isSoloSession: false,
      };
      render(<SettlementDisplay settlementResult={result} />);
      expect(screen.getByText(/Nam/)).toBeInTheDocument();
      expect(screen.getByText(/Huy/)).toBeInTheDocument();
    });
  });

  describe('Req 6.3 — Show exact amount as sub-text when rounding differs', () => {
    it('shows exact amount when it differs from rounded amount', () => {
      const result: SettlementResult = {
        transfers: [
          {
            fromPlayerId: 'p1',
            fromPlayerName: 'Nam',
            toPlayerId: 'p2',
            toPlayerName: 'Bách',
            exactAmount: 166667,
            roundedAmount: 167000,
          },
        ],
        isSoloSession: false,
      };
      render(<SettlementDisplay settlementResult={result} />);
      expect(screen.getByText(/166[,.]667/)).toBeInTheDocument();
    });

    it('does not show exact amount when it equals rounded amount', () => {
      const result: SettlementResult = {
        transfers: [
          {
            fromPlayerId: 'p1',
            fromPlayerName: 'Nam',
            toPlayerId: 'p2',
            toPlayerName: 'Bách',
            exactAmount: 100000,
            roundedAmount: 100000,
          },
        ],
        isSoloSession: false,
      };
      render(<SettlementDisplay settlementResult={result} />);
      // Only one instance of 100,000 should appear (the rounded amount)
      const matches = screen.getAllByText(/100[,.]000/);
      expect(matches).toHaveLength(1);
    });
  });

  describe('Req 6.4 — Solo session message', () => {
    it('displays solo session message when isSoloSession is true', () => {
      const result: SettlementResult = {
        transfers: [],
        isSoloSession: true,
      };
      render(<SettlementDisplay settlementResult={result} />);
      expect(screen.getByText(/solo session/i)).toBeInTheDocument();
      expect(screen.getByText(/no debts to settle/i)).toBeInTheDocument();
    });

    it('does not display solo session message for multi-player sessions', () => {
      const result: SettlementResult = {
        transfers: [
          {
            fromPlayerId: 'p1',
            fromPlayerName: 'Nam',
            toPlayerId: 'p2',
            toPlayerName: 'Bách',
            exactAmount: 100000,
            roundedAmount: 100000,
          },
        ],
        isSoloSession: false,
      };
      render(<SettlementDisplay settlementResult={result} />);
      expect(screen.queryByText(/solo session/i)).not.toBeInTheDocument();
    });
  });
});
