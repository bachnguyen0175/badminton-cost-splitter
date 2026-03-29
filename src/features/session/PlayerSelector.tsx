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
        <h3 className="text-sm font-medium text-muted-foreground">
          Players{selectedCount > 0 && ` (${selectedCount})`}
        </h3>
        {players.length > 0 && (
          <button
            type="button"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-sm text-primary hover:text-primary/80 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
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
              className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'bg-accent text-accent-foreground hover:bg-accent/80'
              }`}
            >
              {player.name}
            </button>
          );
        })}
      </div>

      {selectedCount === 0 && players.length > 0 && (
        <p className="mt-3 text-sm text-secondary">
          Please select players before calculating
        </p>
      )}
    </div>
  );
}
