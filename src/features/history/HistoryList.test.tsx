import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryList } from './HistoryList';
import type { SessionRecord } from '../../core/types';

vi.mock('./sessionService', () => ({
  sessionService: {
    deleteSession: vi.fn(),
  },
}));

vi.mock('./useSessionList', () => ({
  useSessionList: vi.fn(),
}));

import { sessionService } from './sessionService';
import { useSessionList } from './useSessionList';

const mockedDeleteSession = vi.mocked(sessionService.deleteSession);
const mockedUseSessionList = vi.mocked(useSessionList);

function makeSessions(): SessionRecord[] {
  return [
    {
      id: 'session-1',
      date: new Date(2026, 2, 28),
      participants: [
        { id: 'p1', name: 'Bách' },
        { id: 'p2', name: 'Nam' },
        { id: 'p3', name: 'Huy' },
      ],
      costItems: [{ label: 'Sân', amount: 300000 }],
      totalCost: 300000,
      payers: [{ playerId: 'p1', playerName: 'Bách', amount: 300000 }],
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
      note: 'Sân Tân Bình',
    },
    {
      id: 'session-2',
      date: new Date(2026, 2, 25),
      participants: [
        { id: 'p1', name: 'Bách' },
        { id: 'p4', name: 'Long' },
      ],
      costItems: [
        { label: 'Sân', amount: 200000 },
        { label: 'Cầu', amount: 50000 },
      ],
      totalCost: 250000,
      payers: [{ playerId: 'p1', playerName: 'Bách', amount: 250000 }],
      transfers: [
        {
          fromPlayerId: 'p4',
          fromPlayerName: 'Long',
          toPlayerId: 'p1',
          toPlayerName: 'Bách',
          exactAmount: 125000,
          roundedAmount: 125000,
        },
      ],
      note: null,
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HistoryList', () => {
  describe('Req 8.2 — Display session cards sorted by date (newest first)', () => {
    it('renders session cards with date, total cost, and participant names', () => {
      const sessions = makeSessions();
      mockedUseSessionList.mockReturnValue(sessions);

      render(<HistoryList onSelectSession={vi.fn()} />);

      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(2);

      // Session 1 card: March 28, 300,000, Bách, Nam, Huy
      const card1 = within(cards[0]);
      expect(card1.getByText(/28\/03\/2026/)).toBeInTheDocument();
      expect(card1.getByText(/300\.000/)).toBeInTheDocument();
      expect(card1.getByText(/Bách.*Nam.*Huy/)).toBeInTheDocument();

      // Session 2 card: March 25, 250,000, Bách, Long
      const card2 = within(cards[1]);
      expect(card2.getByText(/25\/03\/2026/)).toBeInTheDocument();
      expect(card2.getByText(/250\.000/)).toBeInTheDocument();
      expect(card2.getByText(/Bách.*Long/)).toBeInTheDocument();
    });

    it('renders sessions in order provided by useSessionList (newest first)', () => {
      const sessions = makeSessions();
      mockedUseSessionList.mockReturnValue(sessions);

      render(<HistoryList onSelectSession={vi.fn()} />);

      const cards = screen.getAllByRole('article');
      expect(cards).toHaveLength(2);

      // First card should be session-1 (March 28)
      expect(within(cards[0]).getByText(/28\/03\/2026/)).toBeInTheDocument();
      // Second card should be session-2 (March 25)
      expect(within(cards[1]).getByText(/25\/03\/2026/)).toBeInTheDocument();
    });
  });

  describe('Req 8.3 — Session card display', () => {
    it('displays total cost formatted with VND locale', () => {
      mockedUseSessionList.mockReturnValue(makeSessions());

      render(<HistoryList onSelectSession={vi.fn()} />);

      // 300,000 formatted in vi-VN locale
      expect(screen.getByText(/300\.000/)).toBeInTheDocument();
    });

    it('displays all participant names on each card', () => {
      mockedUseSessionList.mockReturnValue(makeSessions());

      render(<HistoryList onSelectSession={vi.fn()} />);

      const cards = screen.getAllByRole('article');
      // Card 1: 3 participants joined by comma
      expect(within(cards[0]).getByText(/Bách, Nam, Huy/)).toBeInTheDocument();
      // Card 2: 2 participants
      expect(within(cards[1]).getByText(/Bách, Long/)).toBeInTheDocument();
    });

    it('shows empty state when there are no sessions', () => {
      mockedUseSessionList.mockReturnValue([]);

      render(<HistoryList onSelectSession={vi.fn()} />);

      expect(screen.getByText(/no sessions/i)).toBeInTheDocument();
    });
  });

  describe('Req 8.5 — Delete session with confirmation', () => {
    it('shows a delete button on each session card', () => {
      mockedUseSessionList.mockReturnValue(makeSessions());

      render(<HistoryList onSelectSession={vi.fn()} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('shows a confirmation dialog when delete is clicked', async () => {
      mockedUseSessionList.mockReturnValue(makeSessions());
      const user = userEvent.setup();

      render(<HistoryList onSelectSession={vi.fn()} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('deletes the session when confirmation is confirmed', async () => {
      mockedUseSessionList.mockReturnValue(makeSessions());
      mockedDeleteSession.mockResolvedValue();
      const user = userEvent.setup();

      render(<HistoryList onSelectSession={vi.fn()} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(mockedDeleteSession).toHaveBeenCalledWith('session-1');
    });

    it('dismisses the dialog when cancel is clicked without deleting', async () => {
      mockedUseSessionList.mockReturnValue(makeSessions());
      const user = userEvent.setup();

      render(<HistoryList onSelectSession={vi.fn()} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockedDeleteSession).not.toHaveBeenCalled();
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });

  describe('Card interaction', () => {
    it('calls onSelectSession with session id when a card is clicked', async () => {
      mockedUseSessionList.mockReturnValue(makeSessions());
      const onSelectSession = vi.fn();
      const user = userEvent.setup();

      render(<HistoryList onSelectSession={onSelectSession} />);

      const cards = screen.getAllByRole('article');
      await user.click(cards[0]);

      expect(onSelectSession).toHaveBeenCalledWith('session-1');
    });

    it('does not trigger onSelectSession when delete button is clicked', async () => {
      mockedUseSessionList.mockReturnValue(makeSessions());
      const onSelectSession = vi.fn();
      const user = userEvent.setup();

      render(<HistoryList onSelectSession={onSelectSession} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(onSelectSession).not.toHaveBeenCalled();
    });
  });
});
