import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PlayerSelector } from './PlayerSelector';
import type { Player } from '../../core/types';

function createPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    createdAt: new Date(),
  }));
}

describe('PlayerSelector', () => {
  const defaultProps = {
    players: createPlayers(3),
    selectedPlayerIds: new Set<string>(),
    onTogglePlayer: vi.fn(),
    onSelectAll: vi.fn(),
    onDeselectAll: vi.fn(),
  };

  describe('Req 2.1 — Display all players as selectable chips', () => {
    it('renders a chip for each player', () => {
      render(<PlayerSelector {...defaultProps} />);
      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
      expect(screen.getByText('Player 3')).toBeInTheDocument();
    });

    it('renders no chips when player list is empty', () => {
      render(<PlayerSelector {...defaultProps} players={[]} />);
      expect(screen.queryByRole('button', { name: /Player/ })).not.toBeInTheDocument();
    });

    it('renders chips as buttons with minimum 44x44px tap target', () => {
      render(<PlayerSelector {...defaultProps} />);
      const chips = screen.getAllByRole('button', { name: /Player \d/ });
      chips.forEach(chip => {
        expect(chip.className).toMatch(/min-h-\[44px\]/);
        expect(chip.className).toMatch(/min-w-\[44px\]/);
      });
    });
  });

  describe('Req 2.2 — Toggle participation on tap', () => {
    it('calls onTogglePlayer with player ID when a chip is tapped', async () => {
      const user = userEvent.setup();
      const onTogglePlayer = vi.fn();
      render(<PlayerSelector {...defaultProps} onTogglePlayer={onTogglePlayer} />);

      await user.click(screen.getByText('Player 2'));
      expect(onTogglePlayer).toHaveBeenCalledWith('player-2');
    });

    it('visually distinguishes selected chips from unselected', () => {
      const selectedIds = new Set(['player-1']);
      render(<PlayerSelector {...defaultProps} selectedPlayerIds={selectedIds} />);

      const selectedChip = screen.getByText('Player 1').closest('button')!;
      const unselectedChip = screen.getByText('Player 2').closest('button')!;

      // Selected chip should have a distinct style (e.g., bg-blue)
      expect(selectedChip.className).not.toBe(unselectedChip.className);
    });

    it('displays the active participant count', () => {
      const selectedIds = new Set(['player-1', 'player-3']);
      render(<PlayerSelector {...defaultProps} selectedPlayerIds={selectedIds} />);

      expect(screen.getByText(/Players\s*\(2\)/)).toBeInTheDocument();
    });
  });

  describe('Req 2.3 — Enable cost input when at least one participant selected', () => {
    // This is handled by parent component; PlayerSelector signals selection state
    it('does not show warning message when players are selected', () => {
      const selectedIds = new Set(['player-1']);
      render(<PlayerSelector {...defaultProps} selectedPlayerIds={selectedIds} />);

      expect(screen.queryByText(/Please select players before calculating/)).not.toBeInTheDocument();
    });
  });

  describe('Req 2.4 — Show message when no participants selected', () => {
    it('shows "Please select players before calculating" when no participants selected', () => {
      render(<PlayerSelector {...defaultProps} selectedPlayerIds={new Set()} />);

      expect(screen.getByText('Please select players before calculating')).toBeInTheDocument();
    });
  });

  describe('Req 2.5 — Select All / Deselect All toggle', () => {
    it('shows "Select All" button when not all players are selected', () => {
      render(<PlayerSelector {...defaultProps} selectedPlayerIds={new Set(['player-1'])} />);

      expect(screen.getByRole('button', { name: /Select All/i })).toBeInTheDocument();
    });

    it('calls onSelectAll when "Select All" is tapped', async () => {
      const user = userEvent.setup();
      const onSelectAll = vi.fn();
      render(<PlayerSelector {...defaultProps} onSelectAll={onSelectAll} />);

      await user.click(screen.getByRole('button', { name: /Select All/i }));
      expect(onSelectAll).toHaveBeenCalledOnce();
    });

    it('shows "Deselect All" when all players are selected', () => {
      const allIds = new Set(['player-1', 'player-2', 'player-3']);
      render(<PlayerSelector {...defaultProps} selectedPlayerIds={allIds} />);

      expect(screen.getByRole('button', { name: /Deselect All/i })).toBeInTheDocument();
    });

    it('calls onDeselectAll when "Deselect All" is tapped', async () => {
      const user = userEvent.setup();
      const onDeselectAll = vi.fn();
      const allIds = new Set(['player-1', 'player-2', 'player-3']);
      render(
        <PlayerSelector {...defaultProps} selectedPlayerIds={allIds} onDeselectAll={onDeselectAll} />
      );

      await user.click(screen.getByRole('button', { name: /Deselect All/i }));
      expect(onDeselectAll).toHaveBeenCalledOnce();
    });

    it('does not show Select All / Deselect All when player list is empty', () => {
      render(<PlayerSelector {...defaultProps} players={[]} />);

      expect(screen.queryByRole('button', { name: /Select All/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Deselect All/i })).not.toBeInTheDocument();
    });
  });

  describe('Req 10.2 — Touch-friendly sizing', () => {
    it('applies aria-pressed attribute to indicate selection state', () => {
      const selectedIds = new Set(['player-1']);
      render(<PlayerSelector {...defaultProps} selectedPlayerIds={selectedIds} />);

      const selectedChip = screen.getByText('Player 1').closest('button')!;
      const unselectedChip = screen.getByText('Player 2').closest('button')!;

      expect(selectedChip).toHaveAttribute('aria-pressed', 'true');
      expect(unselectedChip).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
