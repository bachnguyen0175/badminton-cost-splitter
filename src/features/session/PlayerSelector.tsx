import type { Player } from '../../core/types';

interface PlayerSelectorProps {
  players: Player[];
  selectedPlayerIds: Set<string>;
  onTogglePlayer: (playerId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function PlayerSelector({
  players,
  selectedPlayerIds,
  onTogglePlayer,
  onSelectAll,
  onDeselectAll,
}: PlayerSelectorProps) {
  const selectedCount = selectedPlayerIds.size;
  const allSelected = players.length > 0 && selectedCount === players.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          Players{selectedCount > 0 && ` (${selectedCount})`}
        </h3>
        {players.length > 0 && (
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {players.map(player => {
          const isSelected = selectedPlayerIds.has(player.id);
          return (
            <button
              key={player.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onTogglePlayer(player.id)}
              className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {player.name}
            </button>
          );
        })}
      </div>

      {selectedCount === 0 && players.length > 0 && (
        <p className="mt-3 text-sm text-amber-600">
          Please select players before calculating
        </p>
      )}
    </div>
  );
}
