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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Players</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setAddError('');
              }}
              placeholder="Player name"
              className="flex-1 px-3 py-2 min-h-[44px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAdd}
              aria-label="Add"
              className="px-4 py-2 min-h-[44px] text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {addError && (
            <p className="mb-4 -mt-2 text-sm text-red-600">{addError}</p>
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
                      className="flex-1 px-3 py-2 min-h-[44px] border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSave}
                      aria-label="Save"
                      className="px-3 py-2 min-h-[44px] text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      aria-label="Cancel"
                      className="px-3 py-2 min-h-[44px] text-sm text-gray-600 border rounded-md hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{player.name}</span>
                    <button
                      onClick={() => startEdit(player.id, player.name)}
                      aria-label={`Edit ${player.name}`}
                      className="px-3 py-2 min-h-[44px] text-sm text-blue-600 border rounded-md hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      aria-label={`Delete ${player.name}`}
                      className="px-3 py-2 min-h-[44px] text-sm text-red-600 border rounded-md hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {editError && (
            <p className="mt-2 text-sm text-red-600">{editError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
