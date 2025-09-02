import React, { useEffect, useCallback } from "react";
import EntityCard from "./EntityCard_old";

/**
 * Generic controller component that decides whether to display a compact EntityCard
 * or an expanded detail view based on the expansion state.
 *
 * Based on KravCardController but made generic for any entity type.
 *
 * Keyboard shortcuts:
 * - E: Enter edit mode (when in view mode)
 * - ESC: Exit edit mode (go to view) or collapse card (when in view mode)
 */
const EntityCardController = ({
  entity,
  modelConfig,
  entityType,
  isExpanded = false,
  expandedMode = "view", // 'view', 'edit', or 'create'
  onExpand,
  onCollapse,
  onEdit,
  onDelete,
  onSave,
  onMerknadUpdate,
  onStatusChange,
  onVurderingChange,
  onPrioritetChange,
  onNavigateToEntity,
  showMerknader = false,
  showStatus = false,
  showVurdering = false,
  showPrioritet = false,
  filesCount = 0,
  childrenCount = 0,
  parentEntity = null,
  renderIcon,
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
            onExpand(entity, "edit");
          }
          break;
        case "escape":
          // Exit edit mode or collapse card
          if (expandedMode === "edit" || expandedMode === "create") {
            event.preventDefault();
            if (expandedMode === "create") {
              // For create mode, collapse completely
              onCollapse(entity?.id);
            } else {
              // For edit mode, go back to view
              onExpand(entity, "view");
            }
          } else if (expandedMode === "view") {
            // In view mode, collapse the card
            event.preventDefault();
            onCollapse(entity?.id);
          }
          break;
      }
    },
    [isExpanded, expandedMode, onExpand, onCollapse, entity]
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
      <EntityCard
        entity={entity}
        modelConfig={modelConfig}
        entityType={entityType}
        onEdit={(entity) => onExpand(entity, "edit")}
        onDelete={onDelete}
        onView={(entity) => onExpand(entity, "view")}
        onMerknadUpdate={onMerknadUpdate}
        onStatusChange={onStatusChange}
        onVurderingChange={onVurderingChange}
        onPrioritetChange={onPrioritetChange}
        showMerknader={showMerknader}
        showStatus={showStatus}
        showVurdering={showVurdering}
        showPrioritet={showPrioritet}
        filesCount={filesCount}
        childrenCount={childrenCount}
        parentEntity={parentEntity}
        renderIcon={renderIcon}
      />
    );
  }

  // If expanded, show the detailed view (placeholder for now)
  // TODO: Implement generic EntityDetailDisplay component
  return (
    <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-4 bg-blue-50 border-b border-blue-200">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={() => onCollapse(entity?.id)}
          title="Klikk for å lukke"
        >
          {expandedMode !== "create" && (
            <span className="text-sm font-mono text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg font-medium border border-blue-200">
              {entity?.kravUID || entity?.tiltakUID || `${entityType.toUpperCase()}${entity?.id}`}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 text-lg">
            {expandedMode === "create" ? `Opprett ny ${entityType}` : entity?.tittel || entity?.navn || "Uten tittel"}
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
              onClick={() => onExpand(entity, "edit")}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Rediger (Trykk 'E')"
            >
              Rediger
            </button>
          )}
          <button
            onClick={() => onCollapse(entity?.id)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Lukk (Trykk 'ESC')"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content - Placeholder for now */}
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🚧 Expanded Entity View - Under Construction</h4>
          <p className="text-yellow-700 text-sm">
            Expanded {entityType} view for "{entity?.tittel || entity?.navn || "Unnamed"}" (Mode: {expandedMode})
          </p>
          <p className="text-yellow-600 text-xs mt-2">This will show the full entity details with inline editing capabilities.</p>
        </div>
      </div>
    </div>
  );
};

export default EntityCardController;
