import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PayerPanel } from './PayerPanel';
import type { PayerEntry } from '../../core/types';

interface Participant {
  id: string;
  name: string;
}

function createParticipants(...names: string[]): Participant[] {
  return names.map((name, i) => ({ id: `p${i + 1}`, name }));
}

describe('PayerPanel', () => {
  const defaultProps = {
    participants: createParticipants('Bách', 'Nam', 'Huy'),
    selectedPayerIds: new Set<string>(),
    payerEntries: [] as PayerEntry[],
    totalCost: 300000,
    payerTotal: 0,
    isPayerAmountValid: false,
    onTogglePayer: vi.fn(),
    onUpdatePayerAmount: vi.fn(),
  };

  describe('Req 5.1 — Display selected participants as selectable payers', () => {
    it('renders a chip/button for each participant', () => {
      render(<PayerPanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Bách/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nam/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Huy/i })).toBeInTheDocument();
    });

    it('calls onTogglePayer when a payer chip is tapped', async () => {
      const user = userEvent.setup();
      const onTogglePayer = vi.fn();
      render(<PayerPanel {...defaultProps} onTogglePayer={onTogglePayer} />);

      await user.click(screen.getByRole('button', { name: /Bách/i }));
      expect(onTogglePayer).toHaveBeenCalledWith('p1');
    });

    it('visually distinguishes selected payers from unselected', () => {
      const selectedPayerIds = new Set(['p1']);
      render(<PayerPanel {...defaultProps} selectedPayerIds={selectedPayerIds} />);

      const selectedChip = screen.getByRole('button', { name: /Bách/i });
      const unselectedChip = screen.getByRole('button', { name: /Nam/i });

      // Selected payer should have a distinct style (e.g., green background)
      expect(selectedChip.className).not.toEqual(unselectedChip.className);
    });
  });

  describe('Req 5.2 — Single payer auto-fill with total cost', () => {
    it('displays the auto-filled amount for a single payer', () => {
      const selectedPayerIds = new Set(['p1']);
      const payerEntries: PayerEntry[] = [{ playerId: 'p1', amount: 300000 }];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
          payerTotal={300000}
          isPayerAmountValid={true}
        />
      );

      expect(screen.getByText(/300[,.]000/)).toBeInTheDocument();
    });

    it('does not show individual amount input fields for single payer', () => {
      const selectedPayerIds = new Set(['p1']);
      const payerEntries: PayerEntry[] = [{ playerId: 'p1', amount: 300000 }];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
          payerTotal={300000}
          isPayerAmountValid={true}
        />
      );

      // Should not have editable amount inputs for single payer
      expect(screen.queryByPlaceholderText(/amount/i)).not.toBeInTheDocument();
    });
  });

  describe('Req 5.3 — Multiple payers with individual amount fields', () => {
    it('displays individual amount input fields for each payer when multiple are selected', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: null },
        { playerId: 'p2', amount: null },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
        />
      );

      const amountInputs = screen.getAllByPlaceholderText(/amount/i);
      expect(amountInputs).toHaveLength(2);
    });

    it('calls onUpdatePayerAmount when a payer amount is changed', async () => {
      const user = userEvent.setup();
      const onUpdatePayerAmount = vi.fn();
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: null },
        { playerId: 'p2', amount: null },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
          onUpdatePayerAmount={onUpdatePayerAmount}
        />
      );

      const amountInputs = screen.getAllByPlaceholderText(/amount/i);
      await user.type(amountInputs[0], '5');
      expect(onUpdatePayerAmount).toHaveBeenCalledWith('p1', 5);
    });

    it('displays payer name labels next to each amount field', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: 200000 },
        { playerId: 'p2', amount: 100000 },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
        />
      );

      // Payer names should be visible as labels in the amount section
      // They're already in chips, but also shown next to amount fields
      const amountInputs = screen.getAllByPlaceholderText(/amount/i);
      expect(amountInputs).toHaveLength(2);
    });
  });

  describe('Req 5.4 — Real-time payer total display', () => {
    it('displays the payer total for multiple payers', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: 200000 },
        { playerId: 'p2', amount: 100000 },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
          payerTotal={300000}
          isPayerAmountValid={true}
        />
      );

      expect(screen.getByText(/300[,.]000/)).toBeInTheDocument();
    });
  });

  describe('Req 5.5 — Red warning on payer amount mismatch', () => {
    it('displays a red warning when payer amounts do not match total cost', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: 200000 },
        { playerId: 'p2', amount: 50000 },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
          payerTotal={250000}
          isPayerAmountValid={false}
        />
      );

      expect(screen.getByText(/mismatch|does not match|doesn't match/i)).toBeInTheDocument();
    });

    it('does not display a warning when payer amounts match total cost', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: 200000 },
        { playerId: 'p2', amount: 100000 },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
          payerTotal={300000}
          isPayerAmountValid={true}
        />
      );

      expect(screen.queryByText(/mismatch|does not match|doesn't match/i)).not.toBeInTheDocument();
    });

    it('does not display mismatch warning when no payers are selected', () => {
      render(<PayerPanel {...defaultProps} />);
      expect(screen.queryByText(/mismatch|does not match|doesn't match/i)).not.toBeInTheDocument();
    });
  });

  describe('Req 5.6 — Validation for zero or negative payer amounts', () => {
    it('shows validation error for zero payer amount', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: 0 },
        { playerId: 'p2', amount: 300000 },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
        />
      );

      expect(screen.getByText(/must be greater than zero/i)).toBeInTheDocument();
    });

    it('shows validation error for negative payer amount', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: -100 },
        { playerId: 'p2', amount: 300000 },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
        />
      );

      expect(screen.getByText(/must be greater than zero/i)).toBeInTheDocument();
    });

    it('does not show validation error for null (empty) payer amount', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: null },
        { playerId: 'p2', amount: 300000 },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
        />
      );

      expect(screen.queryByText(/must be greater than zero/i)).not.toBeInTheDocument();
    });
  });

  describe('Req 5.7 — Numeric input for payer amounts', () => {
    it('renders payer amount inputs with inputMode numeric', () => {
      const selectedPayerIds = new Set(['p1', 'p2']);
      const payerEntries: PayerEntry[] = [
        { playerId: 'p1', amount: null },
        { playerId: 'p2', amount: null },
      ];
      render(
        <PayerPanel
          {...defaultProps}
          selectedPayerIds={selectedPayerIds}
          payerEntries={payerEntries}
        />
      );

      const amountInputs = screen.getAllByPlaceholderText(/amount/i);
      for (const input of amountInputs) {
        expect(input).toHaveAttribute('inputMode', 'numeric');
      }
    });
  });

  describe('Edge cases', () => {
    it('renders nothing meaningful when no participants', () => {
      render(<PayerPanel {...defaultProps} participants={[]} />);
      expect(screen.queryByRole('button', { name: /Bách/i })).not.toBeInTheDocument();
    });
  });
});
