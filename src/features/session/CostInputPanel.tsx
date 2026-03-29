import type { CostItem } from '../../core/types';
import { formatVnd } from '../../core/vndFormat';

interface CostInputPanelProps {
  costItems: CostItem[];
  totalCost: number;
  onAddCostItem: () => void;
  onUpdateCostItem: (id: string, field: 'label' | 'amount', value: string | number) => void;
  onRemoveCostItem: (id: string) => void;
}

const MAX_COST_ITEMS = 10;

export function CostInputPanel({
  costItems,
  totalCost,
  onAddCostItem,
  onUpdateCostItem,
  onRemoveCostItem,
}: CostInputPanelProps) {
  const canAddMore = costItems.length < MAX_COST_ITEMS;
  const canRemove = costItems.length > 1;

  const formattedTotal = formatVnd(totalCost);

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Costs</h3>

      <div className="space-y-3">
        {costItems.map(item => {
          const hasError = item.amount !== null && item.amount <= 0;
          return (
            <div key={item.id} className="flex items-start gap-2">
              <input
                type="text"
                value={item.label}
                onChange={e => onUpdateCostItem(item.id, 'label', e.target.value)}
                placeholder="Label / description"
                className="flex-1 px-4 py-2 min-h-[44px] border border-border rounded-full text-sm bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 transition-all duration-300"
              />
              <div className="flex flex-col">
                <input
                  inputMode="numeric"
                  value={item.amount !== null ? item.amount : ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                      onUpdateCostItem(item.id, 'amount', 0);
                      return;
                    }
                    const num = Number(val);
                    if (!Number.isNaN(num)) {
                      onUpdateCostItem(item.id, 'amount', num);
                    }
                  }}
                  placeholder="Amount"
                  className={`w-28 px-4 py-2 min-h-[44px] border rounded-full text-sm text-right bg-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 transition-all duration-300 ${
                    hasError ? 'border-destructive' : 'border-border'
                  }`}
                />
                {hasError && (
                  <p className="text-xs text-destructive mt-1">Must be greater than zero</p>
                )}
              </div>
              {canRemove && (
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => onRemoveCostItem(item.id)}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-destructive/60 hover:text-destructive transition-colors duration-300"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {canAddMore && (
          <button
            type="button"
            onClick={onAddCostItem}
            className="text-sm text-primary hover:text-primary/80 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors duration-300"
          >
            + Add More
          </button>
        )}
        <div className="text-sm font-medium text-foreground ml-auto">
          Total: {formattedTotal}
        </div>
      </div>
    </div>
  );
}
