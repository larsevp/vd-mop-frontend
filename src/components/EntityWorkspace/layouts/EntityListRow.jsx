import React from "react";

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
  // Get display values from model config
  const titleField =
    modelConfig.workspace?.cardFields?.find((f) => f === "tittel" || f === "title" || f === "navn" || f === "name") || "tittel";

  const uidField = modelConfig.workspace?.cardFields?.find((f) => f.toLowerCase().includes("uid"));

  const descField = modelConfig.workspace?.cardFields?.find(
    (f) => f.toLowerCase().includes("beskrivelse") || f.toLowerCase().includes("description")
  );

  const title = entity[titleField] || "Uten tittel";
  const uid = uidField ? entity[uidField] : `${entityType.toUpperCase()}${entity.id}`;
  const description = descField ? entity[`${descField}Snippet`] || entity[descField] : "";

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
    // console.log('EntityListRow DEBUG - clicked entity:', entity);
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={onFocus}
      onMouseLeave={() => onFocus && onFocus(-1)} // Clear focus when mouse leaves (use -1 to indicate no focus)
      className={`
        relative px-4 py-3 cursor-pointer transition-all duration-150
        ${
          isSelected
            ? "bg-blue-50 text-blue-900"
            : isFocused
            ? "bg-gray-50"
            : "hover:bg-gray-50"
        }
      `}
    >
      {/* Parent reference for child elements */}
      {entity.parentId && entity.parent && viewOptions.showHierarchy && (
        <div className="mb-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50/50 px-2 py-1 rounded">
          <span className="font-medium">
            ↑ {entity.parent.tiltakUID || entity.parent.kravUID || entity.parent.id} - {entity.parent.tittel || entity.parent.navn}
          </span>
        </div>
      )}

      {/* Line 1: Code + Title + Status indicators */}
      <div className="flex items-center gap-2 mb-1">
        {uidField && <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">[{uid}]</span>}
        <span className="font-medium text-gray-900 truncate flex-1">{title}</span>

        {/* Status indicators on the right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {viewOptions.showVurdering && <StatusIndicator display={getVurderingDisplay()} />}
          {viewOptions.showStatus && <StatusIndicator display={getStatusDisplay()} />}
          {viewOptions.showPrioritet && <StatusIndicator display={getPrioritetDisplay()} />}
          {viewOptions.showObligatorisk && getObligatoriskIndicator()}
        </div>
      </div>

      {/* Line 2: Description preview */}
      {description && <div className="text-sm text-gray-600 truncate mb-2">{truncateText(description)}</div>}

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
          {viewOptions.showRelations && entity.krav?.length > 0 && entityType === "tiltak" && (
            <span>Tilknyttet {entity.krav.length} krav</span>
          )}
          {viewOptions.showRelations && entity.tiltak?.length > 0 && entityType === "krav" && (
            <span>Tiltknyttet {entity.tiltak.length} tiltak</span>
          )}
        </div>
        <div className="flex items-center gap-1">{entity.createdBy && <span></span>}</div>
      </div>
    </div>
  );
};

export default EntityListRow;
