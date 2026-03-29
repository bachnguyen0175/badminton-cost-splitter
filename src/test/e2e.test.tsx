import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../core/db';
import MainScreen from '../pages/MainScreen';
import HistoryScreen from '../pages/HistoryScreen';

// Use real services except clipboard (requires secure context)
vi.mock('../core/clipboardService', () => ({
  copySettlementSummary: vi.fn().mockResolvedValue({ success: true, text: 'formatted text' }),
  formatSettlementText: vi.fn().mockReturnValue('formatted text'),
}));

function renderMain() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <MainScreen />
    </MemoryRouter>
  );
}

function renderHistory() {
  return render(
    <MemoryRouter initialEntries={['/history']}>
      <HistoryScreen />
    </MemoryRouter>
  );
}

async function seedPlayers(names: string[]) {
  const players = names.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    createdAt: new Date(),
  }));
  await db.players.bulkAdd(players);
  return players;
}

beforeEach(async () => {
  await db.players.clear();
  await db.sessions.clear();
  vi.clearAllMocks();
});

describe('E2E: Happy Path', () => {
  it('3 players → 1 cost item → 1 payer → settlement displayed → save & copy', async () => {
    await seedPlayers(['Bach', 'Nam', 'Huy']);
    const user = userEvent.setup();
    renderMain();

    // Wait for players to load
    await waitFor(() => {
      expect(screen.getByText('Bach')).toBeInTheDocument();
    });

    // Step 1: Select all 3 players
    await user.click(screen.getByText('Bach'));
    await user.click(screen.getByText('Nam'));
    await user.click(screen.getByText('Huy'));

    // Cost input panel should now be visible
    expect(screen.getByText('Costs')).toBeInTheDocument();

    // Step 2: Enter cost amount (300,000 VND)
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '300000');

    // Step 3: Select Bach as payer
    expect(screen.getByText('Who Paid?')).toBeInTheDocument();
    // Payer panel shows participant names as buttons - find within payer section
    const payerButtons = screen.getAllByText('Bach');
    // Click the payer toggle (second "Bach" button, in payer panel)
    await user.click(payerButtons[payerButtons.length - 1]);

    // Step 4: Verify settlement is displayed
    await waitFor(() => {
      expect(screen.getByText('Settlement')).toBeInTheDocument();
    });

    // Settlement should show transfer arrows (→)
    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBeGreaterThan(0);

    // Step 5: Click Save & Copy
    const copyButton = screen.getByRole('button', { name: /save & copy/i });
    expect(copyButton).not.toBeDisabled();
    await user.click(copyButton);

    // Verify toast message
    await waitFor(() => {
      expect(screen.getByText(/saved & copied/i)).toBeInTheDocument();
    });

    // Verify session was persisted to IndexedDB
    const sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].totalCost).toBe(300000);
    expect(sessions[0].participants).toHaveLength(3);
    expect(sessions[0].transfers.length).toBeGreaterThan(0);
  });
});

describe('E2E: Multi-Payer Mismatch', () => {
  it('shows red warning and disables copy when payer amounts do not match total', async () => {
    await seedPlayers(['Bach', 'Nam']);
    const user = userEvent.setup();
    renderMain();

    await waitFor(() => {
      expect(screen.getByText('Bach')).toBeInTheDocument();
    });

    // Select both players
    await user.click(screen.getByText('Bach'));
    await user.click(screen.getByText('Nam'));

    // Enter cost: 200,000
    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '200000');

    // Select Bach as first payer (green chip in payer panel)
    const bachButtons = screen.getAllByRole('button', { name: 'Bach' });
    // Last "Bach" button is in the payer panel
    await user.click(bachButtons[bachButtons.length - 1]);

    // Verify single payer mode first
    await waitFor(() => {
      expect(screen.getByText(/paid:/i)).toBeInTheDocument();
    });

    // Select Nam as second payer (triggers multi-payer mode)
    const namButtons = screen.getAllByRole('button', { name: 'Nam' });
    await user.click(namButtons[namButtons.length - 1]);

    // Wait for multi-payer mode: individual amount inputs appear
    await waitFor(() => {
      const allInputs = screen.getAllByPlaceholderText('Amount');
      expect(allInputs.length).toBeGreaterThanOrEqual(3);
    });

    // Get all Amount inputs: first is cost, last two are payer amounts
    const allInputs = screen.getAllByPlaceholderText('Amount');
    const bachPayerInput = allInputs[allInputs.length - 2];
    const namPayerInput = allInputs[allInputs.length - 1];

    // Enter mismatched amounts: Bach 100k, Nam 50k (total 150k != 200k)
    await user.clear(bachPayerInput);
    await user.type(bachPayerInput, '100000');
    await user.clear(namPayerInput);
    await user.type(namPayerInput, '50000');

    // Verify mismatch warning is shown
    await waitFor(() => {
      expect(
        screen.getByText(/payer total does not match session total cost/i)
      ).toBeInTheDocument();
    });

    // Settlement should NOT be displayed
    expect(screen.queryByText('Settlement')).not.toBeInTheDocument();

    // Save & Copy button should be disabled
    const copyButton = screen.getByRole('button', { name: /save & copy/i });
    expect(copyButton).toBeDisabled();
  });
});

describe('E2E: New Session Reset with Unsaved Data', () => {
  it('shows 4-option dialog when there is an unsaved settlement', async () => {
    await seedPlayers(['Bach', 'Nam']);
    const user = userEvent.setup();
    renderMain();

    await waitFor(() => {
      expect(screen.getByText('Bach')).toBeInTheDocument();
    });

    // Create a valid settlement: select players, enter cost, select payer
    await user.click(screen.getByText('Bach'));
    await user.click(screen.getByText('Nam'));

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '200000');

    const payerButtons = screen.getAllByText('Bach');
    await user.click(payerButtons[payerButtons.length - 1]);

    // Wait for settlement to appear
    await waitFor(() => {
      expect(screen.getByText('Settlement')).toBeInTheDocument();
    });

    // Click New Session — should show unsaved dialog
    await user.click(screen.getByRole('button', { name: /new session/i }));

    // Verify 4-option dialog
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/unsaved session/i)).toBeInTheDocument();

    // All 4 buttons present
    expect(within(dialog).getByText('Save & Copy')).toBeInTheDocument();
    expect(within(dialog).getByText('Save Only')).toBeInTheDocument();
    expect(within(dialog).getByText('Discard')).toBeInTheDocument();
    expect(within(dialog).getByText('Cancel')).toBeInTheDocument();
  });

  it('Cancel dismisses the dialog without resetting', async () => {
    await seedPlayers(['Bach', 'Nam']);
    const user = userEvent.setup();
    renderMain();

    await waitFor(() => {
      expect(screen.getByText('Bach')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bach'));
    await user.click(screen.getByText('Nam'));

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '200000');

    const payerButtons = screen.getAllByText('Bach');
    await user.click(payerButtons[payerButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Settlement')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /new session/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click Cancel
    await user.click(within(screen.getByRole('dialog')).getByText('Cancel'));

    // Dialog dismissed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Settlement is still visible — session not reset
    expect(screen.getByText('Settlement')).toBeInTheDocument();
  });

  it('Discard resets the session without saving', async () => {
    await seedPlayers(['Bach', 'Nam']);
    const user = userEvent.setup();
    renderMain();

    await waitFor(() => {
      expect(screen.getByText('Bach')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bach'));
    await user.click(screen.getByText('Nam'));

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '200000');

    const payerButtons = screen.getAllByText('Bach');
    await user.click(payerButtons[payerButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Settlement')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /new session/i }));

    // Click Discard
    await user.click(within(screen.getByRole('dialog')).getByText('Discard'));

    // Dialog dismissed, session reset — no settlement, no cost panel
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // No session saved to DB
    const sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(0);
  });

  it('Save Only persists session then resets', async () => {
    await seedPlayers(['Bach', 'Nam']);
    const user = userEvent.setup();
    renderMain();

    await waitFor(() => {
      expect(screen.getByText('Bach')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Bach'));
    await user.click(screen.getByText('Nam'));

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.clear(amountInput);
    await user.type(amountInput, '200000');

    const payerButtons = screen.getAllByText('Bach');
    await user.click(payerButtons[payerButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Settlement')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /new session/i }));

    // Click Save Only
    await user.click(within(screen.getByRole('dialog')).getByText('Save Only'));

    // Session saved to DB
    await waitFor(async () => {
      const sessions = await db.sessions.toArray();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].totalCost).toBe(200000);
    });

    // Toast shown
    await waitFor(() => {
      expect(screen.getByText(/session saved/i)).toBeInTheDocument();
    });
  });
});

describe('E2E: History Navigation', () => {
  it('displays saved sessions in history and shows session detail', async () => {
    // Seed a session directly into the database
    const sessionId = crypto.randomUUID();
    await db.sessions.add({
      id: sessionId,
      date: new Date('2026-03-28'),
      participants: [
        { id: 'p1', name: 'Bach' },
        { id: 'p2', name: 'Nam' },
        { id: 'p3', name: 'Huy' },
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
          exactAmount: 100000,
          roundedAmount: 100000,
        },
        {
          fromPlayerId: 'p3',
          fromPlayerName: 'Huy',
          toPlayerId: 'p1',
          toPlayerName: 'Bach',
          exactAmount: 100000,
          roundedAmount: 100000,
        },
      ],
      note: 'San Tan Binh',
    });

    renderHistory();

    // Wait for the session card to appear
    await waitFor(() => {
      expect(screen.getByText('28/03/2026')).toBeInTheDocument();
    });

    // Verify card data
    expect(screen.getByText('Bach, Nam, Huy')).toBeInTheDocument();

    // Click the session card to open detail
    const card = screen.getByRole('article');
    const user = userEvent.setup();
    await user.click(card);

    // Session detail view should show all data
    await waitFor(() => {
      expect(screen.getByText('Cost Items')).toBeInTheDocument();
    });

    expect(screen.getByText('Court')).toBeInTheDocument();
    expect(screen.getByText('Payers')).toBeInTheDocument();
    expect(screen.getByText('San Tan Binh')).toBeInTheDocument();
    expect(screen.getByText('Settlement')).toBeInTheDocument();

    // Back button should be present
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();

    // Click back to return to history list
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('Session History')).toBeInTheDocument();
      expect(screen.getByText('28/03/2026')).toBeInTheDocument();
    });
  });

  it('delete session from history list', async () => {
    const sessionId = crypto.randomUUID();
    await db.sessions.add({
      id: sessionId,
      date: new Date('2026-03-28'),
      participants: [{ id: 'p1', name: 'Bach' }],
      costItems: [{ label: 'Court', amount: 100000 }],
      totalCost: 100000,
      payers: [{ playerId: 'p1', playerName: 'Bach', amount: 100000 }],
      transfers: [],
      note: null,
    });

    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText('28/03/2026')).toBeInTheDocument();
    });

    // Click delete button
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Confirmation dialog
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Confirm deletion
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // Session removed
    await waitFor(() => {
      expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument();
    });

    // Verify DB is empty
    const sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(0);
  });
});

describe('E2E: Offline Flow', () => {
  it('completes full session flow using only IndexedDB (no network required)', async () => {
    // This test verifies the app works entirely with local storage (IndexedDB via fake-indexeddb).
    // In production, the PWA service worker caches assets for offline use.
    // Here we test the data layer works without any network calls.

    // Step 1: Add players via the player manager UI
    const user = userEvent.setup();
    renderMain();

    // Open player manager
    await user.click(screen.getByRole('button', { name: /manage players/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Add 3 players within the dialog
    const dialog = screen.getByRole('dialog');
    const addInput = within(dialog).getByPlaceholderText(/player name/i);
    const addButton = within(dialog).getByRole('button', { name: /^add$/i });

    await user.type(addInput, 'Bach');
    await user.click(addButton);
    await waitFor(() => {
      expect(within(dialog).getByText('Bach')).toBeInTheDocument();
    });

    await user.type(addInput, 'Nam');
    await user.click(addButton);
    await waitFor(() => {
      expect(within(dialog).getByText('Nam')).toBeInTheDocument();
    });

    await user.type(addInput, 'Huy');
    await user.click(addButton);
    await waitFor(() => {
      expect(within(dialog).getByText('Huy')).toBeInTheDocument();
    });

    // Close player manager
    await user.click(screen.getByRole('button', { name: /close/i }));

    // Step 2: Select all players
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Wait for Select All button and click it
    await waitFor(() => {
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Select All'));

    // Step 3: Enter cost
    await waitFor(() => {
      expect(screen.getByText('Costs')).toBeInTheDocument();
    });

    const amountInput = screen.getByPlaceholderText('Amount');
    await user.type(amountInput, '450000');

    // Step 4: Select payer
    // Find payer toggle for Bach (in payer panel)
    const payerButtons = screen.getAllByText('Bach');
    await user.click(payerButtons[payerButtons.length - 1]);

    // Step 5: Verify settlement
    await waitFor(() => {
      expect(screen.getByText('Settlement')).toBeInTheDocument();
    });

    // Step 6: Save & Copy
    const copyButton = screen.getByRole('button', { name: /save & copy/i });
    expect(copyButton).not.toBeDisabled();
    await user.click(copyButton);

    // Verify persistence
    await waitFor(async () => {
      const sessions = await db.sessions.toArray();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].totalCost).toBe(450000);
      expect(sessions[0].participants).toHaveLength(3);
    });

    // Verify players are in DB
    const players = await db.players.toArray();
    expect(players).toHaveLength(3);
    expect(players.map(p => p.name).sort()).toEqual(['Bach', 'Huy', 'Nam']);
  });
});
