import { useState } from 'react';
import { usePlayerList } from './usePlayerList';
import { playerService } from './playerService';

interface PlayerManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerManager({ isOpen, onClose }: PlayerManagerProps) {
  const players = usePlayerList();
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');

  if (!isOpen) return null;

  async function handleAdd() {
    setAddError('');
    const result = await playerService.addPlayer(newName);
    if (result.ok) {
      setNewName('');
    } else {
      setAddError(
        result.error === 'EMPTY_NAME'
          ? 'Name cannot be empty'
          : 'Name already exists'
      );
    }
  }

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditName(name);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditError('');
  }

  async function handleSave() {
    if (!editingId) return;
    setEditError('');
    const result = await playerService.updatePlayer(editingId, editName);
    if (result.ok) {
      setEditingId(null);
      setEditName('');
    } else {
      setEditError(
        result.error === 'EMPTY_NAME'
          ? 'Name cannot be empty'
          : result.error === 'NOT_FOUND'
            ? 'Player not found'
            : 'Name already exists'
      );
    }
  }

  async function handleDelete(id: string) {
    await playerService.deletePlayer(id);
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md mx-4 bg-background rounded-[2rem] shadow-float border border-border/50">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-lg font-semibold font-heading text-foreground">Manage Players</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError('');
              }}
              placeholder="Player name"
              className="flex-1 px-4 py-2 min-h-[44px] border border-border rounded-full bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 transition-all duration-300"
            />
            <button
              onClick={handleAdd}
              aria-label="Add"
              className="px-6 py-2 min-h-[44px] text-primary-foreground bg-primary rounded-full font-bold shadow-soft hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Add
            </button>
          </div>
          {addError && (
            <p className="mb-4 -mt-2 text-sm text-destructive">{addError}</p>
          )}

          <ul className="space-y-2">
            {players.map((player) => (
              <li key={player.id} className="flex items-center gap-2">
                {editingId === player.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setEditError('');
                      }}
                      className="flex-1 px-4 py-2 min-h-[44px] border border-border rounded-full bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 transition-all duration-300"
                    />
                    <button
                      onClick={handleSave}
                      aria-label="Save"
                      className="px-4 py-2 min-h-[44px] text-sm text-primary-foreground bg-primary rounded-full font-medium hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      aria-label="Cancel"
                      className="px-4 py-2 min-h-[44px] text-sm text-accent-foreground border border-border rounded-full font-medium hover:bg-muted transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-foreground">{player.name}</span>
                    <button
                      onClick={() => startEdit(player.id, player.name)}
                      aria-label={`Edit ${player.name}`}
                      className="px-4 py-2 min-h-[44px] text-sm text-primary border border-primary/30 rounded-full font-medium hover:bg-primary/10 transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      aria-label={`Delete ${player.name}`}
                      className="px-4 py-2 min-h-[44px] text-sm text-destructive border border-destructive/30 rounded-full font-medium hover:bg-destructive/10 transition-all duration-300"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {editError && (
            <p className="mt-2 text-sm text-destructive">{editError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
