import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../core/db';
import MainScreen from './MainScreen';

vi.mock('../features/history/sessionService', () => ({
  sessionService: {
    saveSession: vi.fn().mockResolvedValue('session-id'),
  },
}));

vi.mock('../core/clipboardService', () => ({
  copySettlementSummary: vi.fn().mockResolvedValue({ success: true, text: 'formatted' }),
}));

function renderMainScreen() {
  return render(
    <MemoryRouter>
      <MainScreen />
    </MemoryRouter>
  );
}

beforeEach(async () => {
  await db.players.clear();
  await db.sessions.clear();
});

describe('MainScreen — Task 9.1', () => {
  describe('Header and navigation', () => {
    it('renders the app title', () => {
      renderMainScreen();
      expect(screen.getByText('Badminton Cost Splitter')).toBeInTheDocument();
    });

    it('renders a link to history', () => {
      renderMainScreen();
      const link = screen.getByRole('link', { name: /history/i });
      expect(link).toHaveAttribute('href', '/history');
    });

    it('renders a button to open player management', () => {
      renderMainScreen();
      expect(screen.getByRole('button', { name: /manage players/i })).toBeInTheDocument();
    });
  });

  describe('Player management modal', () => {
    it('opens PlayerManager modal when manage players button is clicked', async () => {
      renderMainScreen();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /manage players/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes PlayerManager modal when close button is clicked', async () => {
      renderMainScreen();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /manage players/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Player selector integration', () => {
    it('displays players from the database as selectable chips', async () => {
      await db.players.bulkAdd([
        { id: 'p1', name: 'Bach', createdAt: new Date() },
        { id: 'p2', name: 'Nam', createdAt: new Date() },
      ]);

      renderMainScreen();

      await waitFor(() => {
        expect(screen.getByText('Bach')).toBeInTheDocument();
        expect(screen.getByText('Nam')).toBeInTheDocument();
      });
    });

    it('shows message when no participants are selected', async () => {
      await db.players.add({ id: 'p1', name: 'Bach', createdAt: new Date() });

      renderMainScreen();

      await waitFor(() => {
        expect(screen.getByText('Bach')).toBeInTheDocument();
      });

      const messages = screen.getAllByText('Please select players before calculating');
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Session form wiring', () => {
    it('shows cost input panel after selecting a participant', async () => {
      await db.players.add({ id: 'p1', name: 'Bach', createdAt: new Date() });

      renderMainScreen();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Bach')).toBeInTheDocument();
      });

      // Select Bach
      await user.click(screen.getByText('Bach'));

      // Cost input should now be visible
      expect(screen.getByText('Costs')).toBeInTheDocument();
    });

    it('shows payer panel after selecting a participant', async () => {
      await db.players.add({ id: 'p1', name: 'Bach', createdAt: new Date() });

      renderMainScreen();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Bach')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Bach'));

      expect(screen.getByText('Who Paid?')).toBeInTheDocument();
    });

    it('renders CopyButton and NewSessionButton', async () => {
      await db.players.add({ id: 'p1', name: 'Bach', createdAt: new Date() });

      renderMainScreen();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByText('Bach')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Bach'));

      expect(screen.getByRole('button', { name: /save & copy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument();
    });
  });

  describe('Toast notification', () => {
    it('displays toast when a reconciliation event occurs', async () => {
      await db.players.bulkAdd([
        { id: 'p1', name: 'Bach', createdAt: new Date() },
        { id: 'p2', name: 'Nam', createdAt: new Date() },
      ]);

      renderMainScreen();
      const user = userEvent.setup();

      // Select Bach
      await waitFor(() => {
        expect(screen.getByText('Bach')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Bach'));

      // Delete Bach from database (triggers reconciliation toast)
      await act(async () => {
        await db.players.delete('p1');
      });

      await waitFor(() => {
        expect(screen.getByText(/Bach was removed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Clipboard fallback modal', () => {
    it('does not show clipboard fallback modal initially', () => {
      renderMainScreen();
      expect(screen.queryByText(/copy the text below/i)).not.toBeInTheDocument();
    });
  });
});
