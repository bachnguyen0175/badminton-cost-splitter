import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../core/db';
import { PlayerManager } from './PlayerManager';

beforeEach(async () => {
  await db.players.clear();
});

describe('PlayerManager', () => {
  it('should not render content when isOpen is false', () => {
    render(<PlayerManager isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(<PlayerManager isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display all players from the database', async () => {
    await db.players.bulkAdd([
      { id: crypto.randomUUID(), name: 'Alice', createdAt: new Date() },
      { id: crypto.randomUUID(), name: 'Bob', createdAt: new Date() },
    ]);

    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('should add a new player when submitting the form', async () => {
    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/player name/i);
    await user.type(input, 'Charlie');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    const players = await db.players.toArray();
    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('Charlie');
  });

  it('should clear the input after adding a player', async () => {
    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/player name/i);
    await user.type(input, 'Charlie');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should show error for empty name', async () => {
    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText(/name cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('should show error for duplicate name', async () => {
    await db.players.add({
      id: crypto.randomUUID(),
      name: 'Alice',
      createdAt: new Date(),
    });

    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/player name/i);
    await user.type(input, 'Alice');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText(/name already exists/i)).toBeInTheDocument();
    });
  });

  it('should delete a player', async () => {
    await db.players.add({
      id: crypto.randomUUID(),
      name: 'Alice',
      createdAt: new Date(),
    });

    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /delete alice/i }));

    await waitFor(() => {
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    const players = await db.players.toArray();
    expect(players).toHaveLength(0);
  });

  it('should enter edit mode on edit button click', async () => {
    await db.players.add({
      id: crypto.randomUUID(),
      name: 'Alice',
      createdAt: new Date(),
    });

    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit alice/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    });
  });

  it('should save edited player name', async () => {
    const id = crypto.randomUUID();
    await db.players.add({ id, name: 'Alice', createdAt: new Date() });

    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit alice/i }));

    const editInput = screen.getByDisplayValue('Alice');
    await user.clear(editInput);
    await user.type(editInput, 'Alicia');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Alicia')).toBeInTheDocument();
    });

    const player = await db.players.get(id);
    expect(player?.name).toBe('Alicia');
  });

  it('should show error for empty name on edit', async () => {
    await db.players.add({
      id: crypto.randomUUID(),
      name: 'Alice',
      createdAt: new Date(),
    });

    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit alice/i }));

    const editInput = screen.getByDisplayValue('Alice');
    await user.clear(editInput);
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/name cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('should show error for duplicate name on edit', async () => {
    await db.players.bulkAdd([
      { id: crypto.randomUUID(), name: 'Alice', createdAt: new Date() },
      { id: crypto.randomUUID(), name: 'Bob', createdAt: new Date() },
    ]);

    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit bob/i }));

    const editInput = screen.getByDisplayValue('Bob');
    await user.clear(editInput);
    await user.type(editInput, 'Alice');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/name already exists/i)).toBeInTheDocument();
    });
  });

  it('should cancel edit mode', async () => {
    await db.players.add({
      id: crypto.randomUUID(),
      name: 'Alice',
      createdAt: new Date(),
    });

    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /edit alice/i }));
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Alice')).not.toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PlayerManager isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
