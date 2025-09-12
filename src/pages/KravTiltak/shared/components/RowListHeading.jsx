import React, { useState } from 'react';
import { ChevronDown, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';

/**
 * RowListHeading - Shared component for KravTiltak entity list headers
 * 
 * Provides:
 * - Item count display
 * - Visning (view options) dropdown
 * - Configurable view options per entity type
 */
const RowListHeading = ({
  itemCount = 0,
  viewOptions = {},
  onViewOptionsChange = () => {},
  availableViewOptions = {},
  // New props for expand/collapse all - always show when hasGroups is true
  hasGroups = false,
  allGroupsExpanded = true,
  onToggleAllGroups = () => {},
  children
}) => {
  const [showViewOptions, setShowViewOptions] = useState(false);

  const handleViewOptionToggle = (key) => {
    onViewOptionsChange({
      ...viewOptions,
      [key]: !viewOptions[key]
    });
  };

  return (
    <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-gray-900">
            {itemCount} {itemCount === 1 ? 'element' : 'elementer'}
          </div>
          
          {/* Expand/Collapse All Groups Button - Always visible */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleAllGroups();
            }}
            className="flex items-center p-1 h-6 w-6"
            title={allGroupsExpanded ? "Skjul alle grupper" : "Vis alle grupper"}
          >
            {allGroupsExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>

          
          {children}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Options */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowViewOptions(!showViewOptions)}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              Visning
              <ChevronDown size={14} className={`transition-transform ${showViewOptions ? "rotate-180" : ""}`} />
            </Button>
            
            {showViewOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewOptions(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Vis informasjon</h3>
                    <div className="space-y-2">
                      {Object.entries(availableViewOptions).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{label}</span>
                          <button
                            onClick={() => handleViewOptionToggle(key)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${
                              viewOptions[key] ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
                              viewOptions[key] ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RowListHeading;