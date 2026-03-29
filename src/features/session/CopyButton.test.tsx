import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';
import type { Transfer, SessionRecord } from '../../core/types';

vi.mock('../history/sessionService', () => ({
  sessionService: {
    saveSession: vi.fn(),
  },
}));

vi.mock('../../core/clipboardService', () => ({
  copySettlementSummary: vi.fn(),
}));

import { sessionService } from '../history/sessionService';
import { copySettlementSummary } from '../../core/clipboardService';

const mockedSaveSession = vi.mocked(sessionService.saveSession);
const mockedCopySummary = vi.mocked(copySettlementSummary);

const transfers: Transfer[] = [
  {
    fromPlayerId: 'p2',
    fromPlayerName: 'Nam',
    toPlayerId: 'p1',
    toPlayerName: 'Bách',
    exactAmount: 126667,
    roundedAmount: 127000,
  },
];

function makeSessionData(): Omit<SessionRecord, 'id'> {
  return {
    date: new Date(2026, 2, 28),
    participants: [
      { id: 'p1', name: 'Bách' },
      { id: 'p2', name: 'Nam' },
    ],
    costItems: [{ label: 'Sân', amount: 300000 }],
    totalCost: 300000,
    payers: [{ playerId: 'p1', playerName: 'Bách', amount: 300000 }],
    transfers,
    note: 'Sân Tân Bình',
  };
}

function renderCopyButton(overrides: Partial<Parameters<typeof CopyButton>[0]> = {}) {
  const defaults = {
    hasValidSettlement: true,
    isPersisted: false,
    sessionData: makeSessionData(),
    onPersisted: vi.fn(),
    onCopied: vi.fn(),
    onClipboardFallback: vi.fn(),
    onToast: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  render(<CopyButton {...props} />);
  return props;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CopyButton', () => {
  it('should render a disabled button when hasValidSettlement is false', () => {
    renderCopyButton({ hasValidSettlement: false });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render an enabled button when hasValidSettlement is true', () => {
    renderCopyButton({ hasValidSettlement: true });
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
  });

  it('should persist session then copy to clipboard on click (not yet persisted)', async () => {
    mockedSaveSession.mockResolvedValue('session-id-1');
    mockedCopySummary.mockResolvedValue({ success: true, text: 'formatted' });

    const props = renderCopyButton({ isPersisted: false });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockedSaveSession).toHaveBeenCalledTimes(1);
    });

    const savedSession = mockedSaveSession.mock.calls[0][0];
    expect(savedSession.totalCost).toBe(300000);
    expect(savedSession.participants).toHaveLength(2);

    expect(props.onPersisted).toHaveBeenCalled();
    expect(mockedCopySummary).toHaveBeenCalledTimes(1);
    expect(props.onCopied).toHaveBeenCalled();
    expect(props.onToast).toHaveBeenCalledWith('Saved & Copied');
  });

  it('should skip persistence and only copy when already persisted', async () => {
    mockedCopySummary.mockResolvedValue({ success: true, text: 'formatted' });

    const props = renderCopyButton({ isPersisted: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockedCopySummary).toHaveBeenCalledTimes(1);
    });

    expect(mockedSaveSession).not.toHaveBeenCalled();
    expect(props.onPersisted).not.toHaveBeenCalled();
    expect(props.onCopied).toHaveBeenCalled();
    expect(props.onToast).toHaveBeenCalledWith('Copied');
  });

  it('should show "Session saved" toast and open fallback modal on clipboard failure (not persisted)', async () => {
    mockedSaveSession.mockResolvedValue('session-id-1');
    mockedCopySummary.mockResolvedValue({ success: false, text: 'fallback text' });

    const props = renderCopyButton({ isPersisted: false });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(props.onToast).toHaveBeenCalledWith('Session saved');
    });

    expect(props.onPersisted).toHaveBeenCalled();
    expect(props.onCopied).not.toHaveBeenCalled();
    expect(props.onClipboardFallback).toHaveBeenCalledWith('fallback text');
  });

  it('should open fallback modal on clipboard failure when already persisted', async () => {
    mockedCopySummary.mockResolvedValue({ success: false, text: 'fallback text' });

    const props = renderCopyButton({ isPersisted: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(props.onClipboardFallback).toHaveBeenCalledWith('fallback text');
    });

    expect(mockedSaveSession).not.toHaveBeenCalled();
    expect(props.onCopied).not.toHaveBeenCalled();
  });

  it('should disable the button while the copy flow is in progress', async () => {
    let resolveSave: (value: string) => void;
    mockedSaveSession.mockReturnValue(new Promise(r => { resolveSave = r; }));
    mockedCopySummary.mockResolvedValue({ success: true, text: 'formatted' });

    renderCopyButton({ isPersisted: false });
    const user = userEvent.setup();
    const button = screen.getByRole('button');

    await user.click(button);

    expect(button).toBeDisabled();

    resolveSave!('id');

    await waitFor(() => {
      expect(button).toBeEnabled();
    });
  });
});
