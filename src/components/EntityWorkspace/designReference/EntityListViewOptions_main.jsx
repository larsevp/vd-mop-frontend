import React, { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Settings, ChevronDown, Eye, EyeOff } from "lucide-react";

/**
 * View options dropdown for EntityListRow customization
 * Controls what information is displayed in the entity list
 */
const EntityListViewOptions = ({ viewOptions, onViewOptionsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optionKey) => {
    onViewOptionsChange({
      ...viewOptions,
      [optionKey]: !viewOptions[optionKey],
    });
  };

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <Settings size={16} />
        Visning
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4">
              {/* Display Options */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Vis informasjon</h3>
                <div className="space-y-2">
                  <ViewToggle
                    label="Hierarki (overordnet/undertiltak)"
                    enabled={viewOptions.showHierarchy}
                    onToggle={() => toggleOption("showHierarchy")}
                  />
                  <ViewToggle label="Vurdering" enabled={viewOptions.showVurdering} onToggle={() => toggleOption("showVurdering")} />
                  <ViewToggle label="Status" enabled={viewOptions.showStatus} onToggle={() => toggleOption("showStatus")} />
                  <ViewToggle label="Prioritet" enabled={viewOptions.showPrioritet} onToggle={() => toggleOption("showPrioritet")} />
                  <ViewToggle
                    label="Obligatorisk/Valgfri"
                    enabled={viewOptions.showObligatorisk}
                    onToggle={() => toggleOption("showObligatorisk")}
                  />
                  <ViewToggle label="Merknad" enabled={viewOptions.showMerknad} onToggle={() => toggleOption("showMerknad")} />
                  <ViewToggle
                    label="Tilknyttede relasjoner"
                    enabled={viewOptions.showRelations}
                    onToggle={() => toggleOption("showRelations")}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper component for view toggles
const ViewToggle = ({ label, enabled, onToggle }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-700">{label}</span>
    <Button variant="ghost" size="sm" onClick={onToggle} className={`p-1 h-6 w-6 ${enabled ? "text-blue-600" : "text-gray-400"}`}>
      {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
    </Button>
  </div>
);

export default EntityListViewOptions;
