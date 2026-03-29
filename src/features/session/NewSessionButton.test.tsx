import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewSessionButton } from './NewSessionButton';
import type { SessionRecord } from '../../core/types';

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

function makeSessionData(): Omit<SessionRecord, 'id'> {
  return {
    date: new Date(2026, 2, 28),
    participants: [
      { id: 'p1', name: 'Bach' },
      { id: 'p2', name: 'Nam' },
    ],
    costItems: [{ label: 'Court', amount: 300000 }],
    totalCost: 300000,
    payers: [{ playerId: 'p1', playerName: 'Bach', amount: 300000 }],
    transfers: [
      {
        fromPlayerId: 'p2',
        fromPlayerName: 'Nam',
        toPlayerId: 'p1',
        toPlayerName: 'Bach',
        exactAmount: 150000,
        roundedAmount: 150000,
      },
    ],
    note: null,
  };
}

interface RenderOptions {
  hasValidSettlement?: boolean;
  isPersisted?: boolean;
  sessionData?: Omit<SessionRecord, 'id'>;
}

function renderButton(overrides: RenderOptions = {}) {
  const props = {
    hasValidSettlement: overrides.hasValidSettlement ?? false,
    isPersisted: overrides.isPersisted ?? false,
    sessionData: overrides.sessionData,
    onReset: vi.fn(),
    onPersisted: vi.fn(),
    onCopied: vi.fn(),
    onToast: vi.fn(),
    onClipboardFallback: vi.fn(),
  };
  render(<NewSessionButton {...props} />);
  return props;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NewSessionButton', () => {
  it('should render a "New Session" button', () => {
    renderButton();
    expect(screen.getByRole('button', { name: /new session/i })).toBeInTheDocument();
  });

  it('should reset immediately when no valid unsaved settlement exists', async () => {
    const props = renderButton({ hasValidSettlement: false });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should reset immediately when settlement is already persisted', async () => {
    const props = renderButton({ hasValidSettlement: true, isPersisted: true });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should show confirmation dialog when there is unsaved valid settlement', async () => {
    renderButton({
      hasValidSettlement: true,
      isPersisted: false,
      sessionData: makeSessionData(),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Unsaved session')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save & copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save only/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should dismiss dialog on Cancel without resetting', async () => {
    const props = renderButton({
      hasValidSettlement: true,
      isPersisted: false,
      sessionData: makeSessionData(),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(props.onReset).not.toHaveBeenCalled();
  });

  it('should discard data and reset on Discard', async () => {
    const props = renderButton({
      hasValidSettlement: true,
      isPersisted: false,
      sessionData: makeSessionData(),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));
    await user.click(screen.getByRole('button', { name: /discard/i }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockedSaveSession).not.toHaveBeenCalled();
  });

  it('should persist session and reset on Save Only', async () => {
    mockedSaveSession.mockResolvedValue('session-id-1');
    const props = renderButton({
      hasValidSettlement: true,
      isPersisted: false,
      sessionData: makeSessionData(),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));
    await user.click(screen.getByRole('button', { name: /save only/i }));

    await waitFor(() => {
      expect(mockedSaveSession).toHaveBeenCalledTimes(1);
    });

    expect(props.onPersisted).toHaveBeenCalled();
    expect(props.onToast).toHaveBeenCalledWith('Session saved');
    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should persist, copy to clipboard, and reset on Save & Copy (clipboard success)', async () => {
    mockedSaveSession.mockResolvedValue('session-id-1');
    mockedCopySummary.mockResolvedValue({ success: true, text: 'formatted' });
    const props = renderButton({
      hasValidSettlement: true,
      isPersisted: false,
      sessionData: makeSessionData(),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));
    await user.click(screen.getByRole('button', { name: /save & copy/i }));

    await waitFor(() => {
      expect(mockedSaveSession).toHaveBeenCalledTimes(1);
    });

    expect(mockedCopySummary).toHaveBeenCalledTimes(1);
    expect(props.onPersisted).toHaveBeenCalled();
    expect(props.onCopied).toHaveBeenCalled();
    expect(props.onToast).toHaveBeenCalledWith('Saved & Copied');
    expect(props.onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should persist, show fallback on clipboard failure, and reset on Save & Copy', async () => {
    mockedSaveSession.mockResolvedValue('session-id-1');
    mockedCopySummary.mockResolvedValue({ success: false, text: 'fallback text' });
    const props = renderButton({
      hasValidSettlement: true,
      isPersisted: false,
      sessionData: makeSessionData(),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));
    await user.click(screen.getByRole('button', { name: /save & copy/i }));

    await waitFor(() => {
      expect(mockedSaveSession).toHaveBeenCalledTimes(1);
    });

    expect(props.onPersisted).toHaveBeenCalled();
    expect(props.onToast).toHaveBeenCalledWith('Session saved');
    expect(props.onClipboardFallback).toHaveBeenCalledWith('fallback text');
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('should disable dialog buttons while processing Save & Copy', async () => {
    let resolveSave: (value: string) => void;
    mockedSaveSession.mockReturnValue(new Promise(r => { resolveSave = r; }));
    mockedCopySummary.mockResolvedValue({ success: true, text: 'formatted' });

    renderButton({
      hasValidSettlement: true,
      isPersisted: false,
      sessionData: makeSessionData(),
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /new session/i }));
    await user.click(screen.getByRole('button', { name: /save & copy/i }));

    // All dialog action buttons should be disabled while processing
    expect(screen.getByRole('button', { name: /save & copy/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /save only/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /discard/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    resolveSave!('id');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
