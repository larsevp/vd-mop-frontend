import React, { useState } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/primitives/popover';
import { Separator } from '@/components/ui/primitives/separator';

/**
 * BulkActionsMenu - Dropdown menu for bulk actions in multi-select mode
 *
 * @param {Object[]} actions - Array of action configurations
 * @param {string} actions[].label - Action label (e.g., "Slett", "Kopier")
 * @param {Component} actions[].icon - Lucide icon component
 * @param {Function} actions[].onClick - Handler function that receives selectedIds Set
 * @param {string} [actions[].variant] - 'destructive' for dangerous actions (red text)
 * @param {boolean} [actions[].separator] - Show separator before this action
 * @param {boolean} [actions[].disabled] - Disable the action
 * @param {boolean} [actions[].showCount] - Show selected count (default: true)
 *
 * @param {Set} selectedIds - Set of selected entity IDs
 * @param {boolean} [disabled] - Disable the entire menu
 *
 * @example
 * <BulkActionsMenu
 *   actions={[
 *     {
 *       label: 'Kopier',
 *       icon: Copy,
 *       onClick: (ids) => handleCopy(ids),
 *     },
 *     {
 *       label: 'Slett',
 *       icon: Trash2,
 *       variant: 'destructive',
 *       separator: true,
 *       onClick: (ids) => handleDelete(ids),
 *     },
 *   ]}
 *   selectedIds={selectedIds}
 * />
 */
const BulkActionsMenu = ({
  actions = [],
  selectedIds = new Set(),
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (actions.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex items-center gap-1.5"
            disabled={disabled}
          >
            <MoreHorizontal size={14} />
            Handlinger
            <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-0"
        onInteractOutside={() => setIsOpen(false)}
      >
        <div className="p-1">
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.separator && index > 0 && (
                <Separator className="my-1" />
              )}
              <button
                onClick={() => {
                  action.onClick(selectedIds);
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  action.variant === 'destructive' ? 'text-red-600 hover:bg-red-50' : ''
                }`}
              >
                {action.icon && <action.icon size={16} className="flex-shrink-0" />}
                <span className="flex-1">{action.label}</span>
                {action.showCount !== false && (
                  <span className="text-xs text-muted-foreground">
                    {selectedIds.size}
                  </span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BulkActionsMenu;
