import React from "react";
import { EntityTypeResolver } from "@/components/EntityWorkspace/services/EntityTypeResolver";

/**
 * Ultra-clean two-line entity row with configurable display options
 * Line 1: [Code] Title • Category + Status
 * Line 2: Description preview + Status indicators
 * Footer: Links • Updated • Owner
 */
const EntityListRow = ({
  entity,
  modelConfig,
  entityType,
  isSelected,
  isFocused,
  onClick,
  onFocus,
  renderIcon,
  viewOptions = {
    showHierarchy: true,
    showVurdering: true,
    showStatus: true,
    showPrioritet: true,
    showObligatorisk: true,
    showMerknad: true,
    showRelations: true,
  },
}) => {
  // Check if this is a combined view
  const isCombinedView = entityType === "combinedEntities" || entityType === "combined" || entityType === "prosjekt-combined";

  // For combined views, resolve the specific model config for this entity
  const resolvedModelConfig = isCombinedView && entity.entityType ? EntityTypeResolver.resolveModelConfig(entity.entityType) : modelConfig;

  // Get display values from resolved model config
  const titleField =
    resolvedModelConfig.workspace?.cardFields?.find((f) => f === "tittel" || f === "title" || f === "navn" || f === "name") || "tittel";

  const uidField = resolvedModelConfig.workspace?.cardFields?.find((f) => f.toLowerCase().includes("uid"));

  const descField = resolvedModelConfig.workspace?.cardFields?.find(
    (f) => f.toLowerCase().includes("beskrivelse") || f.toLowerCase().includes("description")
  );

  const title = entity[titleField] || "Uten tittel";

  // Fix UID generation for combined views - use entity.entityType if available
  const actualEntityType = entity.entityType || entityType;

  // Determine the correct UID field based on entity type
  let uid;
  if (uidField && entity[uidField]) {
    uid = entity[uidField];
  } else {
    // Handle specific entity types with their own UID fields
    if (actualEntityType === "prosjektkrav" && entity.kravUID) {
      uid = entity.kravUID;
    } else if (actualEntityType === "prosjekttiltak" && entity.tiltakUID) {
      uid = entity.tiltakUID;
    } else if (actualEntityType === "krav" && entity.kravUID) {
      uid = entity.kravUID;
    } else if (actualEntityType === "tiltak" && entity.tiltakUID) {
      uid = entity.tiltakUID;
    } else {
      // Fallback to generated UID
      uid = `${actualEntityType.toUpperCase()}${entity.id}`;
    }
  }

  // Improved description resolution - try snippet first, then process TipTap JSON
  let description = "";
  if (descField) {
    // Try snippet field first
    description = entity[`${descField}Snippet`];

    // If no snippet, try to process TipTap JSON from the raw field
    if (!description && entity[descField]) {
      const rawDesc = entity[descField];
      if (typeof rawDesc === "object" && rawDesc.type === "doc" && rawDesc.content) {
        // Extract text from TipTap JSON structure
        description = extractTextFromTipTap(rawDesc);
      } else if (typeof rawDesc === "string") {
        description = rawDesc;
      }
    }
  }

  // Fallback to common snippet field names if descField isn't found
  if (!description) {
    description =
      entity.beskrivelseSnippet ||
      extractTextFromTipTap(entity.beskrivelse) ||
      entity.descriptionSnippet ||
      extractTextFromTipTap(entity.description) ||
      "";
  }

  // Helper function to extract text from TipTap JSON
  function extractTextFromTipTap(tipTapObj) {
    if (!tipTapObj || typeof tipTapObj !== "object") return "";
    if (typeof tipTapObj === "string") return tipTapObj;

    let text = "";
    if (tipTapObj.content && Array.isArray(tipTapObj.content)) {
      tipTapObj.content.forEach((node) => {
        if (node.type === "paragraph" && node.content) {
          node.content.forEach((textNode) => {
            if (textNode.type === "text" && textNode.text) {
              text += textNode.text + " ";
            }
          });
        }
      });
    }
    return text.trim();
  }

  // Status display helpers
  const getStatusDisplay = () => {
    if (!entity.status) return null;
    return {
      text: entity.status.navn,
      color: entity.status.color || "#6b7280",
      icon: entity.status.icon,
    };
  };

  const getVurderingDisplay = () => {
    if (!entity.vurdering) return null;
    return {
      text: entity.vurdering.navn,
      color: entity.vurdering.color || "#6b7280",
      icon: entity.vurdering.icon,
    };
  };

  const getPrioritetDisplay = () => {
    if (!entity.prioritet) return null;
    const prioritet = entity.prioritet;
    if (prioritet >= 30) return { text: "Høy", color: "#dc2626", icon: "AlertTriangle" };
    if (prioritet >= 20) return { text: "Middels", color: "#d97706", icon: "AlertCircle" };
    return { text: "Lav", color: "#059669", icon: "Circle" };
  };

  // Status indicator component
  const StatusIndicator = ({ display, iconName }) => {
    if (!display) return null;

    return (
      <div className="flex items-center gap-1">
        {display.icon && renderIcon && <div style={{ color: display.color }}>{renderIcon(display.icon, 12)}</div>}
        <span className="text-xs" style={{}}>
          {display.text}
        </span>
      </div>
    );
  };

  // Obligatorisk status indicator with icons
  const getObligatoriskIndicator = () => {
    if (entity.obligatorisk === true) {
      return (
        <div className="text-blue-600" title="Obligatorisk">
          {renderIcon && renderIcon("Check", 14)}
        </div>
      );
    }
    if (entity.obligatorisk === false) {
      return (
        <div className="text-green-600" title="Valgfri">
          {renderIcon && renderIcon("Check", 14)}
        </div>
      );
    }
    return null;
  };

  const truncateText = (text, maxLength = 140) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleClick = (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    e.stopPropagation(); // Stop event bubbling
    // EntityListRow DEBUG - clicked entity: entity
    onClick();
  };

  // Check if this entity should be indented - logic depends on the view context
  let shouldIndent = false;

  if (isCombinedView) {
    // Combined view: indent tiltak that are displayed under a krav, and child entities
    shouldIndent = entity._displayedUnderKrav === true || entity.parentId;
  } else {
    // Regular views: use traditional indentation rules
    const hasKravConnections =
      (actualEntityType === "tiltak" || actualEntityType === "prosjekttiltak") && entity.krav && entity.krav.length > 0;
    const hasParent = entity.parentId;
    shouldIndent = hasKravConnections || hasParent;
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={onFocus}
      onMouseLeave={() => onFocus && onFocus(-1)} // Clear focus when mouse leaves (use -1 to indicate no focus)
      className={`
        relative cursor-pointer transition-all duration-150
        ${shouldIndent ? "pl-8 pr-4 py-3 ml-4 border-l-2 border-green-200" : "px-4 py-3"}
        ${isSelected ? "bg-blue-50 text-blue-900" : isFocused ? "bg-gray-50" : "hover:bg-gray-50"}
      `}
    >
      {/* Line 1: Complete metadata header - UID + Parent + Entity type + Status indicators */}
      <div className="flex items-center justify-between gap-2 mb-1">
        {/* Left side: UID + Entity type + Parent reference */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* UID always first */}
          {uid && <span className="text-xs font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-medium">[{uid}]</span>}

          {/* Entity type indicator - always show when available */}
          {entity.entityType && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                entity.entityType === "krav" || entity.entityType === "prosjektkrav"
                  ? "bg-blue-100 text-blue-700"
                  : entity.entityType === "tiltak" || entity.entityType === "prosjekttiltak"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {entity.entityType === "krav" || entity.entityType === "prosjektkrav"
                ? "KRAV"
                : entity.entityType === "tiltak" || entity.entityType === "prosjekttiltak"
                ? "TILTAK"
                : entity.entityType.toUpperCase()}
            </span>
          )}

          {/* Parent reference for child elements */}
          {entity.parentId && entity.parent && viewOptions.showHierarchy && (
            <span className="text-xs text-blue-600 font-medium">
              ↑ {entity.parent.tiltakUID || entity.parent.kravUID || entity.parent.id} -{" "}
              {(entity.parent.tittel || entity.parent.navn || "").substring(0, 10)}
              {(entity.parent.tittel || entity.parent.navn || "").length > 10 ? "..." : ""}
            </span>
          )}
        </div>

        {/* Right side: Status indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {viewOptions.showVurdering && <StatusIndicator display={getVurderingDisplay()} />}
          {viewOptions.showStatus && <StatusIndicator display={getStatusDisplay()} />}
          {viewOptions.showPrioritet && <StatusIndicator display={getPrioritetDisplay()} />}
          {viewOptions.showObligatorisk && getObligatoriskIndicator()}
        </div>
      </div>

      {/* Line 2: Title (full width, prominent) */}
      <div className="mb-1">
        <span className="font-medium text-gray-900">{title}</span>
      </div>

      {/* Line 3: Description preview (full width, readable) */}
      {description && <div className="text-sm text-gray-600 mb-2">{truncateText(description)}</div>}

      {/* Merknad if defined and enabled */}
      {viewOptions.showMerknad && (entity.merknad || entity.merknader) && (
        <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
          <span className="text-xs font-medium text-amber-800">Merknad:</span> {truncateText(entity.merknad || entity.merknader, 100)}
        </div>
      )}

      {/* Footer: Meta info */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {entity.parentId && !entity.parent && <span className="text-blue-600">Under{entityType}</span>}
          {viewOptions.showRelations && (entity.filesCount || entity.files?.length) > 0 && (
            <span> {entity.filesCount || entity.files?.length} vedlegg</span>
          )}
          {viewOptions.showRelations && (entity.childrenCount || entity.children?.length) > 0 && (
            <span className="text-emerald-600 font-medium">
              {entity.childrenCount || entity.children?.length} under{entityType}
            </span>
          )}
          {viewOptions.showRelations &&
            entity.krav?.length > 0 &&
            (actualEntityType === "tiltak" || actualEntityType === "prosjekttiltak") && (
              <span className="text-blue-600 font-medium">→ {entity.krav.length} krav</span>
            )}
          {viewOptions.showRelations &&
            entity.tiltak?.length > 0 &&
            (actualEntityType === "krav" || actualEntityType === "prosjektkrav") && (
              <span className="text-green-600 font-medium">→ {entity.tiltak.length} tiltak</span>
            )}
        </div>
        <div className="flex items-center gap-1">{entity.createdBy && <span></span>}</div>
      </div>
    </div>
  );
};

export default EntityListRow;
