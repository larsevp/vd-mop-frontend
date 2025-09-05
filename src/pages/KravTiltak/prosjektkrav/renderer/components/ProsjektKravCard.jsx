import React from 'react';
import { CheckCircle, Star, AlertTriangle, AlertCircle, Circle, Check } from 'lucide-react';

/**
 * ProsjektKravCard - Entity-specific card for ProsjektKrav
 * 
 * Based on the original EntityListRow design with proper structure:
 * Line 1: Entity type badge + UID + parent references + status indicators  
 * Line 2: Title (prominent)
 * Line 3: Description preview
 * Footer: Relations and meta info
 */
const ProsjektKravCard = ({
  entity,
  isSelected = false,
  onClick = () => {},
  viewOptions = {}
}) => {
  const handleClick = () => {
    onClick(entity);
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 60) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Get title
  const title = entity.tittel || entity.title || 'Uten tittel';
  
  // Get UID 
  const uid = entity.kravUID;

  // Get description
  const description = entity.beskrivelseSnippet || entity.descriptionSnippet || '';

  // Check if this entity should be indented (child elements)
  const shouldIndent = entity.parentId;

  // Icon mapping
  const getIcon = (iconName, size = 12) => {
    const iconMap = {
      'CheckCircle': CheckCircle,
      'Star': Star,
      'AlertTriangle': AlertTriangle,
      'AlertCircle': AlertCircle,
      'Circle': Circle,
      'Check': Check,
    };
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent size={size} /> : null;
  };

  // Status display helpers
  const getStatusDisplay = () => {
    if (!entity.status) return null;
    return {
      text: entity.status.navn,
      color: entity.status.color || "#6b7280",
      icon: entity.status.icon || 'CheckCircle',
    };
  };

  const getVurderingDisplay = () => {
    if (!entity.vurdering) return null;
    return {
      text: entity.vurdering.navn,
      color: entity.vurdering.color || "#6b7280",
      icon: entity.vurdering.icon || 'Star',
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
  const StatusIndicator = ({ display }) => {
    if (!display) return null;
    return (
      <div className="flex items-center gap-1">
        {display.icon && (
          <div style={{ color: display.color }}>
            {getIcon(display.icon, 12)}
          </div>
        )}
        <span className="text-xs">
          {display.text}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-150 border border-gray-200 block mb-1
        ${shouldIndent ? "pl-12 pr-4 py-3 border-l-4 border-green-200 w-[calc(100%+2rem)]" : "px-4 py-3 w-full"}
        ${isSelected ? 'bg-blue-50 text-blue-900 border-blue-200' : 'hover:bg-gray-50 hover:border-gray-300'}
      `}
      onClick={handleClick}
    >
      {/* Line 1: Complete metadata header - Entity type + UID + Status indicators */}
      <div className="flex items-center justify-between gap-2 mb-1">
        {/* Left side: Entity type + UID + Parent reference */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Entity type indicator */}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            KRAV
          </span>
          
          {/* UID */}
          {uid && (
            <span className="text-xs font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-medium">
              [{uid}]
            </span>
          )}

          {/* Parent reference for child elements */}
          {entity.parentId && entity.parent && viewOptions.showHierarchy && (
            <span className="text-xs text-blue-600 font-medium">
              ↑ {entity.parent.kravUID} - {truncateText(entity.parent.tittel, 10)}
            </span>
          )}
        </div>

        {/* Right side: Status indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {viewOptions.showVurdering && <StatusIndicator display={getVurderingDisplay()} />}
          {viewOptions.showStatus && <StatusIndicator display={getStatusDisplay()} />}
          {viewOptions.showPrioritet && <StatusIndicator display={getPrioritetDisplay()} />}
          
          {/* Obligatorisk indicator */}
          {viewOptions.showObligatorisk && entity.obligatorisk !== undefined && (
            <div 
              className={entity.obligatorisk ? 'text-blue-600' : 'text-green-600'} 
              title={entity.obligatorisk ? "Obligatorisk" : "Valgfri"}
            >
              {getIcon("Check", 14)}
            </div>
          )}
        </div>
      </div>

      {/* Line 2: Title (full width, prominent) */}
      <div className="mb-1">
        <span className="font-medium text-gray-900">{title}</span>
      </div>

      {/* Line 3: Description preview (full width, readable) */}
      {description && (
        <div className="text-sm text-gray-600 mb-2">
          {truncateText(description)}
        </div>
      )}

      {/* Merknad if defined and enabled */}
      {viewOptions.showMerknad && entity.merknader && (
        <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
          <span className="text-xs font-medium text-amber-800">Merknad:</span> {truncateText(entity.merknader, 100)}
        </div>
      )}

      {/* Footer: Meta info and relations */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Child count */}
          {viewOptions.showRelations && entity.children?.length > 0 && (
            <span className="text-emerald-600 font-medium">
              {entity.children.length} underkrav
            </span>
          )}
          
          {/* Tiltak connections */}
          {viewOptions.showRelations && entity.prosjektTiltak?.length > 0 && (
            <span className="text-green-600 font-medium">
              → {entity.prosjektTiltak.length} tiltak
            </span>
          )}
          
          {/* File attachments */}
          {viewOptions.showRelations && entity.files?.length > 0 && (
            <span>{entity.files.length} vedlegg</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Could add created/updated info here */}
        </div>
      </div>
    </div>
  );
};

export default ProsjektKravCard;