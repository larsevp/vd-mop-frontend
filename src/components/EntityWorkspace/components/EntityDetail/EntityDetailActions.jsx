/**
 * EntityDetailActions - Action buttons for entity detail panel
 * Save, Cancel, Delete actions with proper confirmation
 */

import React from 'react';
import { Save, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';

const EntityDetailActions = ({ onSave, onCancel, onDelete, isNewEntity }) => {
  return (
    <div className="border-t bg-white px-6 py-4 sticky bottom-0 z-20">
      <div className="flex items-center justify-between">
        {/* Primary actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onSave}
            className="flex items-center gap-2"
            size="sm"
          >
            <Save size={16} />
            {isNewEntity ? 'Create' : 'Save Changes'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
            size="sm"
          >
            <X size={16} />
            Cancel
          </Button>
        </div>

        {/* Destructive actions */}
        {onDelete && !isNewEntity && (
          <Button
            variant="destructive"
            onClick={onDelete}
            className="flex items-center gap-2"
            size="sm"
          >
            <Trash2 size={16} />
            Delete
          </Button>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
          Ctrl+S
        </kbd>{' '}
        to save •{' '}
        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
          Esc
        </kbd>{' '}
        to cancel
      </div>
    </div>
  );
};

export default EntityDetailActions;