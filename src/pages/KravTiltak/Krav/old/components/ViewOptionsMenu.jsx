import React from "react";
import { Settings, ChevronDown } from "lucide-react";

/**
 * ViewOptionsMenu component for configuring how the Krav list is displayed
 * Provides toggles for grouping and merknad visibility
 */
const ViewOptionsMenu = ({ 
  groupByEmne, 
  onGroupByEmneChange, 
  showMerknader, 
  onShowMerknaderChange 
}) => {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <Settings className="h-4 w-4" />
        Visningsalternativer
        <ChevronDown className="h-4 w-4" />
      </button>
      
      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border border-neutral-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-10">
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-neutral-900 border-b border-neutral-100 pb-2">
            Visningsinnstillinger
          </h3>
          
          {/* Group by Emne Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">
              Grupper etter emne
            </label>
            <button
              onClick={() => onGroupByEmneChange(!groupByEmne)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                groupByEmne ? "bg-blue-600" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  groupByEmne ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          
          {/* Show Merknader Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">
              Vis merknader
            </label>
            <button
              onClick={() => onShowMerknaderChange(!showMerknader)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showMerknader ? "bg-blue-600" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showMerknader ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          
          <div className="pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Endringer vises umiddelbart i listen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOptionsMenu;