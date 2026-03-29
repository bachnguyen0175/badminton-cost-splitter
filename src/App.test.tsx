import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { db } from './core/db';
import MainScreen from './pages/MainScreen';

const HistoryScreen = lazy(() => import('./pages/HistoryScreen'));

function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route
          path="/history"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <HistoryScreen />
            </Suspense>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(async () => {
  await db.players.clear();
  await db.sessions.clear();
});

describe('App Routing — Task 9.2', () => {
  it('renders MainScreen at / route', () => {
    renderApp('/');
    expect(screen.getByText('Badminton Cost Splitter')).toBeInTheDocument();
  });

  it('lazy-loads HistoryScreen at /history route', async () => {
    renderApp('/history');

    // Shows loading fallback first (or immediately resolves)
    await waitFor(() => {
      expect(screen.getByText('Session History')).toBeInTheDocument();
    });
  });

  it('navigates from main screen to history via link', async () => {
    renderApp('/');
    const user = userEvent.setup();

    const historyLink = screen.getByRole('link', { name: /history/i });
    await user.click(historyLink);

    await waitFor(() => {
      expect(screen.getByText('Session History')).toBeInTheDocument();
    });
  });

  it('navigates from history back to main screen via link', async () => {
    renderApp('/history');
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Session History')).toBeInTheDocument();
    });

    const backLink = screen.getByRole('link', { name: /back to session/i });
    await user.click(backLink);

    await waitFor(() => {
      expect(screen.getByText('Badminton Cost Splitter')).toBeInTheDocument();
    });
  });

  it('MainScreen header contains player management and history navigation', () => {
    renderApp('/');
    expect(screen.getByRole('button', { name: /manage players/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument();
  });
});
