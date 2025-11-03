import React, { useState, useRef } from 'react';
import { ChevronDown, Settings, Maximize2, Minimize2, CheckSquare, ListChecks, Printer } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import BulkActionsMenu from './BulkActionsMenu';
import { useReactToPrint } from 'react-to-print';

/**
 * RowListHeading - Shared component for KravTiltak entity list headers
 *
 * Provides:
 * - Item count display
 * - Visning (view options) dropdown
 * - Configurable view options per entity type
 * - Multi-select mode with contextual bulk actions
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
  // Multi-select props
  selectionMode = 'single',
  selectedIds = new Set(),
  onToggleSelectionMode = () => {},
  onSelectAll = () => {},
  onClearSelection = () => {},
  allItemIds = [],
  allEntitiesMetadata = [], // Metadata for combined views (optional)
  // Bulk action handlers (array of action configs)
  bulkActions = [],
  children
}) => {
  // Extract viewMode from viewOptions to hide multiselect in cards mode
  const viewMode = viewOptions?.viewMode || 'split';
  const [showViewOptions, setShowViewOptions] = useState(false);

  // Create a ref that will hold the article-view-container element
  const contentRef = useRef(null);

  // Setup print handler for article view
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: 'Artikkelvisning',
  });

  // Get the element by ID and assign to ref when printing
  const onPrintClick = () => {
    // Get the article-view-container element
    const element = document.getElementById('article-view-container');
    if (element) {
      contentRef.current = element;
      handlePrint();
    } else {
      console.error('Could not find article-view-container element');
    }
  };

  const handleViewOptionToggle = (key) => {
    onViewOptionsChange({
      ...viewOptions,
      [key]: !viewOptions[key]
    });
  };

  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-white print-hide">
      {/* Main toolbar - always visible */}
      <div className="flex items-center justify-between px-3 h-[60px]">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-gray-900">
            {itemCount} {itemCount === 1 ? 'element' : 'elementer'}
          </div>

          {/* Expand/Collapse All Groups Button */}
          {hasGroups && (
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
          )}

          {children}
        </div>

        <div className="flex items-center gap-2">
          {/* Print button - show only in cards/article mode */}
          {viewMode === 'cards' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintClick}
              className="h-8 flex items-center gap-1.5"
              title="Skriv ut artikkelvisning"
            >
              <Printer size={14} />
              Skriv ut
            </Button>
          )}

          {/* Multi-select toggle button - hide in cards/article mode */}
          {viewMode !== 'cards' && (
            <Button
              variant={selectionMode === 'multi' ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleSelectionMode}
              className="h-8 flex items-center gap-1.5"
            >
              {selectionMode === 'multi' ? (
                <>
                  <CheckSquare size={14} />
                  Avbryt
                </>
              ) : (
                <>
                  <ListChecks size={14} />
                  Velg
                </>
              )}
            </Button>
          )}

          {/* View Options - hide in cards/article mode */}
          {viewMode !== 'cards' && (
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
          )}
        </div>
      </div>

      {/* Multi-select toolbar - conditionally rendered to not take up space when hidden */}
      {viewMode !== 'cards' && (
        <div
          className={`flex items-center justify-between px-3 border-t transition-colors duration-200 ${
            selectionMode === 'multi'
              ? 'bg-blue-50 border-blue-100 py-2 min-h-[44px]'
              : 'bg-white border-gray-200 h-0 py-0 overflow-hidden opacity-0'
          }`}
        >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
            {selectedIds.size} valgt
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className={`h-7 text-xs ${selectedIds.size === 0 ? 'invisible' : ''}`}
          >
            Fjern valg
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectAll(allItemIds, allEntitiesMetadata)}
            className={`h-7 text-xs ${selectedIds.size === allItemIds.length || allItemIds.length === 0 ? 'invisible' : ''}`}
          >
            Velg alle ({allItemIds.length})
          </Button>
        </div>

        {/* Bulk actions dropdown - always rendered to maintain height */}
        <div className={selectedIds.size === 0 ? 'invisible' : ''}>
          <BulkActionsMenu
            actions={bulkActions}
            selectedIds={selectedIds}
          />
        </div>
      </div>
      )}
    </div>
  );
};

export default RowListHeading;