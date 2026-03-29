import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CostInputPanel } from './CostInputPanel';
import type { CostItem } from '../../core/types';

function createCostItem(overrides: Partial<CostItem> = {}): CostItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    label: overrides.label ?? '',
    amount: overrides.amount === undefined ? null : overrides.amount,
    ...overrides,
  };
}

describe('CostInputPanel', () => {
  const defaultProps = {
    costItems: [createCostItem({ id: 'item-1' })],
    totalCost: 0,
    onAddCostItem: vi.fn(),
    onUpdateCostItem: vi.fn(),
    onRemoveCostItem: vi.fn(),
  };

  describe('Req 3.1 — Initial cost line-item input field', () => {
    it('renders a label input and an amount input for each cost item', () => {
      render(<CostInputPanel {...defaultProps} />);
      expect(screen.getByPlaceholderText(/label|description/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/amount/i)).toBeInTheDocument();
    });

    it('renders multiple rows for multiple cost items', () => {
      const costItems = [
        createCostItem({ id: 'item-1', label: 'Court fee' }),
        createCostItem({ id: 'item-2', label: 'Shuttlecocks' }),
      ];
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);
      expect(screen.getByDisplayValue('Court fee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Shuttlecocks')).toBeInTheDocument();
    });
  });

  describe('Req 3.2 — Add More button appends rows', () => {
    it('renders an "Add More" button', () => {
      render(<CostInputPanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Add More/i })).toBeInTheDocument();
    });

    it('calls onAddCostItem when "Add More" is tapped', async () => {
      const user = userEvent.setup();
      const onAddCostItem = vi.fn();
      render(<CostInputPanel {...defaultProps} onAddCostItem={onAddCostItem} />);

      await user.click(screen.getByRole('button', { name: /Add More/i }));
      expect(onAddCostItem).toHaveBeenCalledOnce();
    });
  });

  describe('Req 3.3 — Auto-summed total cost', () => {
    it('displays the total cost', () => {
      render(<CostInputPanel {...defaultProps} totalCost={250000} />);
      expect(screen.getByText(/250[,.]000/)).toBeInTheDocument();
    });

    it('displays zero total when no valid amounts', () => {
      render(<CostInputPanel {...defaultProps} totalCost={0} />);
      expect(screen.getByText(/Total/i)).toBeInTheDocument();
    });
  });

  describe('Req 3.4 — Remove cost line item', () => {
    it('renders a remove button for each cost item when there are multiple items', () => {
      const costItems = [
        createCostItem({ id: 'item-1' }),
        createCostItem({ id: 'item-2' }),
      ];
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(2);
    });

    it('calls onRemoveCostItem with the correct id when remove is tapped', async () => {
      const user = userEvent.setup();
      const onRemoveCostItem = vi.fn();
      const costItems = [
        createCostItem({ id: 'item-1' }),
        createCostItem({ id: 'item-2' }),
      ];
      render(
        <CostInputPanel
          {...defaultProps}
          costItems={costItems}
          onRemoveCostItem={onRemoveCostItem}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);
      expect(onRemoveCostItem).toHaveBeenCalledWith('item-1');
    });

    it('does not render remove button when there is only one cost item', () => {
      render(<CostInputPanel {...defaultProps} />);
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe('Req 3.5 — Validation for zero or negative amounts', () => {
    it('shows validation error for zero amount', () => {
      const costItems = [createCostItem({ id: 'item-1', amount: 0 })];
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);
      expect(screen.getByText(/must be greater than zero/i)).toBeInTheDocument();
    });

    it('shows validation error for negative amount', () => {
      const costItems = [createCostItem({ id: 'item-1', amount: -100 })];
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);
      expect(screen.getByText(/must be greater than zero/i)).toBeInTheDocument();
    });

    it('does not show validation error for valid positive amount', () => {
      const costItems = [createCostItem({ id: 'item-1', amount: 50000 })];
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);
      expect(screen.queryByText(/must be greater than zero/i)).not.toBeInTheDocument();
    });

    it('does not show validation error for null (empty) amount', () => {
      const costItems = [createCostItem({ id: 'item-1', amount: null })];
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);
      expect(screen.queryByText(/must be greater than zero/i)).not.toBeInTheDocument();
    });
  });

  describe('Req 3.6 — Numeric input for amounts', () => {
    it('renders amount input with inputMode numeric', () => {
      render(<CostInputPanel {...defaultProps} />);
      const amountInput = screen.getByPlaceholderText(/amount/i);
      expect(amountInput).toHaveAttribute('inputMode', 'numeric');
    });

    it('calls onUpdateCostItem with label field on label change', async () => {
      const user = userEvent.setup();
      const onUpdateCostItem = vi.fn();
      render(
        <CostInputPanel {...defaultProps} onUpdateCostItem={onUpdateCostItem} />
      );

      const labelInput = screen.getByPlaceholderText(/label|description/i);
      await user.type(labelInput, 'Court');
      expect(onUpdateCostItem).toHaveBeenCalledWith('item-1', 'label', expect.any(String));
    });

    it('calls onUpdateCostItem with amount field on amount change', async () => {
      const user = userEvent.setup();
      const onUpdateCostItem = vi.fn();
      render(
        <CostInputPanel {...defaultProps} onUpdateCostItem={onUpdateCostItem} />
      );

      const amountInput = screen.getByPlaceholderText(/amount/i);
      await user.type(amountInput, '5');
      expect(onUpdateCostItem).toHaveBeenCalledWith('item-1', 'amount', 5);
    });
  });

  describe('Req 3.7 — Maximum 10 cost line items', () => {
    it('hides "Add More" button when 10 items are present', () => {
      const costItems = Array.from({ length: 10 }, (_, i) =>
        createCostItem({ id: `item-${i + 1}` })
      );
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);
      expect(screen.queryByRole('button', { name: /Add More/i })).not.toBeInTheDocument();
    });

    it('shows "Add More" button when fewer than 10 items', () => {
      const costItems = Array.from({ length: 9 }, (_, i) =>
        createCostItem({ id: `item-${i + 1}` })
      );
      render(<CostInputPanel {...defaultProps} costItems={costItems} />);
      expect(screen.getByRole('button', { name: /Add More/i })).toBeInTheDocument();
    });
  });
});
