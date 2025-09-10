import React, { useState, useEffect, useMemo, useRef } from "react";
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import FlexScrollableContainer from "./FlexScrollableContainer";

/**
 * Modern EntitySplitView with draggable resizer (copied from main branch design)
 * Left pane: Entity list with search/filters
 * Right pane: Entity detail view
 * Features:
 * - Draggable resizer bar
 * - Collapsible panels
 * - Persistent width/collapsed state
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
  listWidth = "35%",
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
    
    // Constrain width to reasonable bounds
    const minWidth = 250;
    const maxWidth = Math.min(600, containerRect.width * 0.6);
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
    <div className="flex h-full bg-gray-50 relative">
      {/* Left Panel - Entity List */}
      <div 
        ref={leftPanelRef}
        className={`bg-white border-r border-gray-200 transition-all duration-200 ease-out ${
          isCollapsed ? 'w-0' : ''
        }`}
        style={{ 
          width: isCollapsed ? '0px' : panelWidth,
          minWidth: isCollapsed ? '0px' : '250px'
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

      {/* Resizer Handle */}
      <div 
        className={`relative bg-gray-100 hover:bg-gray-200 cursor-col-resize transition-colors duration-150 ${
          isDragging ? 'bg-blue-200' : ''
        }`}
        style={{ width: '6px' }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Collapse/Expand Button */}
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
          className={`absolute left-1/2 transform -translate-x-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm ${
            isHovering || isCollapsed ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ pointerEvents: 'auto', top: 'calc(50% - 40px)' }}
          title={isCollapsed ? "Vis liste" : "Skjul liste"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>

        {/* Drag Handle */}
        {!isCollapsed && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        )}
      </div>

      {/* Right Panel - Detail View */}
      <div className="flex-1 bg-white">
        <FlexScrollableContainer 
          className="h-full" 
          dependencies={[selectedEntity]}
          fadeColor="from-white"
        >
          {renderDetailPane && selectedEntity ? renderDetailPane(selectedEntity, {
            onSave,
            onDelete,
            onClose: onClose || (() => onEntitySelect(null)),
            entities
          }) : (
            renderDetailPane && renderDetailPane(null, {
              onSave,
              onDelete, 
              onClose: onClose || (() => onEntitySelect(null)),
              entities
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