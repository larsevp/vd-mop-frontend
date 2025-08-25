import React, { useEffect, useCallback } from "react";
import KravCard from "../KravCard.jsx";
import KravDetailDisplay from "./KravDetailDisplay";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";

/**
 * Controller component that decides whether to display a compact KravCard
 * or an expanded KravDetailDisplay based on the expansion state.
 *
 * This keeps both KravCard and KravDetailDisplay focused on their specific
 * responsibilities while providing a clean interface for the parent component.
 *
 * Keyboard shortcuts:
 * - E: Enter edit mode (when in view mode)
 * - ESC: Exit edit mode (go to view) or collapse card (when in view mode)
 */
const KravCardController = ({
  krav,
  isExpanded = false,
  expandedMode = "view", // 'view', 'edit', or 'create'
  onExpand,
  onCollapse,
  onEdit,
  onDelete,
  onSave,
  onNavigateToKrav,
  showMerknader = false,
  filesCount = 0,
  childrenCount = 0,
  parentKrav = null,
}) => {
  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (event) => {
      // Only handle shortcuts when this card is expanded
      if (!isExpanded) return;

      // Ignore shortcuts if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.contentEditable === "true");

      if (isTyping) return;

      switch (event.key.toLowerCase()) {
        case "e":
          // Enter edit mode (only if currently in view mode)
          if (expandedMode === "view") {
            event.preventDefault();
            onExpand(krav, "edit");
          }
          break;
        case "escape":
          // Exit edit mode or collapse card
          if (expandedMode === "edit" || expandedMode === "create") {
            event.preventDefault();
            if (expandedMode === "create") {
              // For create mode, collapse completely
              onCollapse(krav?.id);
            } else {
              // For edit mode, go back to view
              onExpand(krav, "view");
            }
          } else if (expandedMode === "view") {
            // In view mode, collapse the card
            event.preventDefault();
            onCollapse(krav?.id);
          }
          break;
      }
    },
    [isExpanded, expandedMode, onExpand, onCollapse, krav]
  );

  // Add keyboard event listeners when expanded
  useEffect(() => {
    if (isExpanded) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isExpanded, handleKeyDown]);

  // If not expanded, show the compact card
  if (!isExpanded) {
    return (
      <KravCard
        krav={krav}
        onEdit={(krav) => onExpand(krav, "edit")}
        onDelete={onDelete}
        onView={(krav) => onExpand(krav, "view")}
        onSave={onSave}
        showMerknader={showMerknader}
        filesCount={filesCount}
        childrenCount={childrenCount}
        parentKrav={parentKrav}
      />
    );
  }

  // If expanded, show the detailed view
  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={() => onCollapse(krav?.id)}
          title="Klikk for å lukke"
        >
          {expandedMode !== "create" && (
            <span className="text-sm font-mono text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg font-medium border border-blue-200">
              {krav?.kravUID || `GK${krav?.id}`}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 text-lg">
            {expandedMode === "create" ? "Opprett nytt krav" : krav?.tittel || "Uten tittel"}
          </h3>
          {(expandedMode === "edit" || expandedMode === "create") && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">ESC for å avbryte</span>
          )}
          {expandedMode === "view" && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">E for å redigere • ESC for å lukke</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {expandedMode === "view" && (
            <button
              onClick={() => onExpand(krav, "edit")}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Rediger (Trykk 'E')"
            >
              Rediger
            </button>
          )}
          <button
            onClick={() => onCollapse(krav?.id)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Lukk (Trykk 'ESC')"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <div className="max-h-[80vh] overflow-y-auto">
        <KravDetailDisplay
          krav={krav}
          mode={expandedMode}
          onEdit={(krav) => onExpand(krav, "edit")}
          onSave={(savedKrav) => {
            onSave(savedKrav);
            // After save, switch to view mode
            onExpand(savedKrav, "view");
          }}
          onCancel={() => {
            if (expandedMode === "create") {
              // If creating, collapse completely
              onCollapse(krav?.id);
            } else {
              // If editing, go back to view mode
              onExpand(krav, "view");
            }
          }}
          onNavigateToKrav={onNavigateToKrav}
          modelConfig={kravConfig}
          isInlineExpanded={true} // Flag to indicate this is inline, not modal
        />
      </div>
    </div>
  );
};

export default KravCardController;
