import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import ScrollableContainer from "../../layout/scrollable-container";
import { 
  ChevronDown, 
  Plus, 
  Minus, 
  Trash2,
  Table as TableIcon
} from "lucide-react";

const ToolbarButton = React.forwardRef(({ onClick, active, disabled, children, title, className }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "px-3 py-1.5 rounded text-sm font-medium transition-colors border",
      "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      active 
        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
        : "bg-background text-foreground border-border",
      className
    )}
  >
    {children}
  </button>
));

export const TableDropdown = ({ editor, onAddTable, onDeleteTable, onAddRowBefore, onAddRowAfter, onDeleteRow, onAddColumnBefore, onAddColumnAfter, onDeleteColumn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInTable, setIsInTable] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 'auto' });
  const buttonRef = useRef(null);

  // Calculate dropdown position using viewport coordinates
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 160;
    const dropdownHeight = 240; // max height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate position
    let top = buttonRect.bottom + 4; // 4px gap
    let left = buttonRect.right - dropdownWidth; // Right-align by default
    
    // Adjust horizontal position if it overflows
    if (left < 8) { // 8px margin from edge
      left = buttonRect.left; // Left-align instead
    }
    if (left + dropdownWidth > viewportWidth - 8) {
      left = viewportWidth - dropdownWidth - 8; // Keep within viewport
    }
    
    // Adjust vertical position if it overflows
    if (top + dropdownHeight > viewportHeight - 8) {
      top = buttonRect.top - dropdownHeight - 4; // Position above button
    }
    
    setPosition({ top, left, right: 'auto' });
  }, []);

  // Update table state when editor selection changes
  React.useEffect(() => {
    if (!editor) return;

    const updateTableState = () => {
      const newIsInTable = editor.isActive("table");
      setIsInTable(newIsInTable);
      if (!newIsInTable) {
        setIsOpen(false); // Close dropdown when leaving table
      }
    };

    editor.on('selectionUpdate', updateTableState);
    updateTableState(); // Initial check

    return () => {
      editor.off('selectionUpdate', updateTableState);
    };
  }, [editor]);

  // Update position on scroll/resize
  React.useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      calculateDropdownPosition();
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, calculateDropdownPosition]);

  return (
    <div className="relative">
      <ToolbarButton
        ref={buttonRef}
        onClick={() => {
          if (isInTable) {
            calculateDropdownPosition();
            setIsOpen(!isOpen);
          } else {
            onAddTable();
          }
        }}
        title={isInTable ? "Table Options" : "Insert Table"}
        active={isInTable}
      >
        <div className="flex items-center gap-1">
          <TableIcon size={16} />
          <span>Tabell</span>
          <ChevronDown size={12} className={isInTable ? "opacity-100" : "opacity-0"} />
        </div>
      </ToolbarButton>
      
      {isOpen && isInTable && (
        <div 
          className="fixed bg-white border border-border rounded-md shadow-lg z-10 w-[160px]"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px`,
            right: position.right 
          }}
        >
          <ScrollableContainer maxHeight="240px" fadeColor="from-white" className="p-0">
            <div className="py-1">
              <button
                onClick={() => { onAddRowBefore(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Row Above
              </button>
              <button
                onClick={() => { onAddRowAfter(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Row Below
              </button>
              <button
                onClick={() => { onDeleteRow(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 text-red-600 flex items-center gap-2"
              >
                <Minus size={14} />
                Delete Row
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { onAddColumnBefore(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Column Left
              </button>
              <button
                onClick={() => { onAddColumnAfter(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Column Right
              </button>
              <button
                onClick={() => { onDeleteColumn(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 text-red-600 flex items-center gap-2"
              >
                <Minus size={14} />
                Delete Column
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { onDeleteTable(); setIsOpen(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 text-red-600 font-medium flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete Table
              </button>
            </div>
          </ScrollableContainer>
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};