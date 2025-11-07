import React, { useState, useEffect, useMemo, useRef } from "react";
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import FlexScrollableContainer from "./FlexScrollableContainer";

/**
 * EntitySplitView - Split view mode layout component
 *
 * NOMENCLATURE: SPLIT VIEW MODE
 * ==============================
 *
 * Layout Structure:
 * ├─ Card List (Left Pane) - Resizable, collapsible
 * │  └─ Entity cards for browsing and selection
 * │     - Compact summary view
 * │     - Click to select entity for editing
 * │     - Default width: 420px (user-adjustable, persisted)
 * │     - Can collapse to 0px to maximize detail pane
 * │
 * ├─ Resizer Bar (12px)
 * │  └─ Draggable handle with collapse/expand button
 * │     - Hover to show collapse button
 * │     - Drag to resize panes
 * │
 * └─ Detail Pane (Right Pane) - Flexible width
 *    └─ Full entity form for editing
 *       - Create, read, update, delete operations
 *       - Sectioned form layout
 *       - Scrollable content area
 *
 * Features:
 * - Draggable resizer bar (12px wide)
 * - Collapsible left panel with button
 * - Persistent width/collapsed state (localStorage)
 * - Scandinavian minimal design
 */
const EntitySplitView = ({
  entities = [],
  entityType,
  selectedEntity,
  onEntitySelect,
  renderListPane,
  renderDetailPane,
  onSave,
  onDelete,
  onClose,
  onCreateNew,
  listWidth = "35%",
  dto,  // NEW: DTO instance for inheritance logic
}) => {
  // Collapsible panel state - persistent with localStorage (global preference)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('splitView-listPaneCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Resizable width state - persistent with localStorage (global preference)
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('splitView-listPaneWidth');
    // Ensure we have a reasonable default and validate saved value
    if (saved) {
      const parsedWidth = parseFloat(saved);
      // If it's a reasonable pixel value, use it; otherwise reset to default
      if (saved.includes("px") && parsedWidth >= 200 && parsedWidth <= 600) {
        return saved;
      }
      // If it's a percentage, convert to reasonable pixel default
      if (saved.includes("%") && parsedWidth > 0 && parsedWidth <= 50) {
        return "420px"; // Reasonable default
      }
    }
    // Fallback to reasonable pixel default
    return "420px";
  });

  // Drag state for resizing
  const [isDragging, setIsDragging] = useState(false);
  
  // Hover state for showing collapse button
  const [isHovering, setIsHovering] = useState(false);

  // Ref for the left panel to avoid DOM traversal issues
  const leftPanelRef = useRef(null);

  // Persistent collapsed state (global preference)
  useEffect(() => {
    localStorage.setItem('splitView-listPaneCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Persistent width state (global preference)
  useEffect(() => {
    localStorage.setItem('splitView-listPaneWidth', panelWidth);
  }, [panelWidth]);

  // Mouse handlers for dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const container = leftPanelRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    
    // Almost no limits - let user drag as far as they want
    const minWidth = 150; // Very small minimum
    const maxWidth = containerRect.width - 100; // Leave just 100px for right pane minimum
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    setPanelWidth(`${constrainedWidth}px`);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Global mouse event handling during drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Toggle collapsed state
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      {/* Left Panel - Entity List */}
      <div
        ref={leftPanelRef}
        className={`bg-white border-r border-slate-200 transition-all duration-200 ease-out ${
          isCollapsed ? 'w-0' : ''
        }`}
        style={{
          width: isCollapsed ? '0px' : panelWidth,
          minWidth: isCollapsed ? '0px' : '150px' // Match the new lower drag constraint minimum
        }}
      >
        {!isCollapsed && (
          <div className="h-full">
            {renderListPane && renderListPane({
              entities,
              selectedEntity,
              onEntitySelect
            })}
          </div>
        )}
      </div>

      {/* Resizer Handle - Scandinavian minimal design */}
      <div
        className={`relative bg-slate-100 hover:bg-slate-200 cursor-col-resize transition-colors duration-150 ${
          isDragging ? 'bg-slate-300' : ''
        }`}
        style={{ width: '12px' }} // Doubled from 6px to 12px for better drag area
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Collapse/Expand Button - Scandinavian style */}
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleCollapsed();
          }}
          className={`absolute left-1/2 transform -translate-x-1/2 z-10 bg-white border border-slate-300 rounded-full p-2 hover:bg-slate-50 hover:border-slate-400 transition-all duration-150 shadow-sm ${
            isHovering || isCollapsed ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ pointerEvents: 'auto', top: 'calc(50% - 40px)' }}
          title={isCollapsed ? "Vis liste" : "Skjul liste"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-600" />
          )}
        </button>

        {/* Drag Handle */}
        {!isCollapsed && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <GripVertical className="w-3 h-3 text-slate-400" />
          </div>
        )}
      </div>

      {/* Right Panel - Detail View */}
      <div className="flex-1 bg-white min-w-0">
        <FlexScrollableContainer
          className="h-full"
          dependencies={[selectedEntity]}
          fadeColor="from-white"
        >
          {renderDetailPane && selectedEntity ? renderDetailPane(selectedEntity, {
            onSave,
            onDelete,
            onClose: onClose || (() => onEntitySelect(null)),
            onCreateNew,
            entities,
            dto  // NEW: Pass dto for inheritance logic
          }) : (
            renderDetailPane && renderDetailPane(null, {
              onSave,
              onDelete,
              onClose: onClose || (() => onEntitySelect(null)),
              onCreateNew,
              entities,
              dto  // NEW: Pass dto for inheritance logic
            })
          )}
        </FlexScrollableContainer>
      </div>

      {/* Drag overlay during resize */}
      {isDragging && (
        <div className="absolute inset-0 cursor-col-resize bg-transparent z-50" />
      )}
    </div>
  );
};

export default EntitySplitView;