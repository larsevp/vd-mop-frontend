import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Settings, ChevronDown } from "lucide-react";

/**
 * Shared ViewOptionsMenu component for configuring view preferences
 * Works with both Krav and Tiltak workspaces
 */
const ViewOptionsMenu = ({ 
  groupByEmne, 
  onGroupByEmneChange, 
  showMerknader, 
  onShowMerknaderChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (callback) => {
    return (e) => {
      e.preventDefault();
      callback(!callback.currentValue);
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={handleToggle}
      >
        <Settings className="h-4 w-4" />
        Visning
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
              Visningsalternativer
            </div>
            
            <label className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByEmne}
                onChange={(e) => onGroupByEmneChange(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Grupper etter emne</span>
            </label>
            
            <label className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showMerknader}
                onChange={(e) => onShowMerknaderChange(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Vis merknadsfelt</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOptionsMenu;