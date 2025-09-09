import React from 'react';
import { Eye } from 'lucide-react';
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";

// Import helpers
import { truncateText, getEntityTitle } from './helpers/textHelpers';
import { getIcon } from './helpers/iconHelpers.jsx';
import { getStatusDisplay, getVurderingDisplay, getPrioritetDisplay } from '../../utils/statusHelpers';
import { getSpecialReference, getParentReference } from './helpers/referenceHelpers.jsx';

// Import components
import StatusIndicator from '../StatusIndicator';

/**
 * EntityCard - Shared card component for all KravTiltak entities
 * 
 * Features two distinct layouts:
 * - Cards Mode: Magazine-style layout with full rich text content
 * - Split Mode: Compact table-like layout with truncated content
 * 
 * This component handles krav, tiltak, prosjektKrav, and prosjektTiltak
 * through a configuration object that defines entity-specific behavior.
 */
const EntityCard = ({
  entity,
  isSelected = false,
  onClick = () => {},
  onDoubleClick = () => {},
  viewOptions = {},
  config = {},
  'data-entity-id': dataEntityId,
  ...restProps
}) => {
  const handleClick = () => {
    onClick(entity);
  };

  const handleDoubleClick = () => {
    onDoubleClick(entity);
  };

  // Get computed values
  const title = getEntityTitle(entity, config);
  const uid = entity[config.uidField] || entity.uid;
  const isExpandedCards = viewOptions.viewMode === 'cards';
  const shouldIndent = entity.parentId;

  /**
   * Get description content based on view mode
   * Uses DisplayValueResolver for rich text in cards mode
   */
  const getDescription = () => {
    if (isExpandedCards && entity.beskrivelse) {
      // Use DisplayValueResolver for rich text rendering in expanded cards mode
      const beskrivelseField = { name: 'beskrivelse', type: 'basicrichtext' };
      const context = { 
        format: 'REACT', 
        source: 'DETAIL' // Show full content without truncation
      };
      return DisplayValueResolver.resolveDisplayValue(entity, beskrivelseField, context);
    } else {
      // Use snippet for compact split view
      return entity.beskrivelseSnippet || entity.descriptionSnippet || '';
    }
  };

  return (
    <div
      data-entity-id={dataEntityId}
      className={`
        relative cursor-pointer transition-all duration-200 block w-full
        ${isExpandedCards 
          ? `bg-white rounded-xl shadow-sm hover:shadow-md mb-8 p-8 ${isSelected ? 'border-2 border-blue-300 bg-blue-50' : 'border border-gray-200'}`
          : `mb-1 px-4 py-3 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} ${shouldIndent ? 'relative' : ''}`
        }
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >

      <div className={shouldIndent ? 'ml-8' : ''}>
        {isExpandedCards ? (
          /* 🎨 CARDS MODE - Main content on left, status box on right */
        <div className="flex gap-4">
          {/* Main content area */}
          <div className="flex-1">
            {/* Line 1: Complete metadata header */}
            <div className="flex items-center gap-2 mb-1 min-w-0 overflow-hidden">
              {/* Entity type indicator */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeColor}`}>
                {config.badgeText}
              </span>
              
              {/* UID */}
              {uid && (
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${config.badgeColor}`}>
                  [{uid}]
                </span>
              )}

              {/* Special reference (e.g., generalTiltak) */}
              {getSpecialReference(entity)}

              {/* Parent reference for child elements */}
              {getParentReference(entity)}
            </div>

            {/* Line 2: Title */}
            <div className="mb-2">
              <span className="font-medium text-gray-900 text-base">{title}</span>
            </div>

            {/* Line 3: Rich description - MAIN DIFFERENCE: Full rich text in cards */}
            {(entity.beskrivelse || entity.beskrivelseSnippet || entity.descriptionSnippet) && (
              <div className="text-sm text-gray-600 mb-3 prose prose-sm max-w-none">
                {getDescription()}
              </div>
            )}

            {/* Merknad */}
            {viewOptions.showMerknad && entity.merknad && (
              <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mb-3">
                <span className="text-xs font-medium text-amber-800">Merknad:</span> {truncateText(entity.merknad, 100)}
              </div>
            )}

            {/* Footer: Meta info and relations */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-3">
                {/* Child count */}
                {viewOptions.showRelations && entity.children?.length > 0 && (
                  <span className="text-emerald-600 font-medium">
                    {entity.children.length} {config.childrenLabel || "underelementer"}
                  </span>
                )}
                
                {/* Related entities */}
                {config.relations && config.relations.map((relation) => {
                  const count = Array.isArray(entity[relation.field]) ? entity[relation.field].length : (entity[relation.field] ? 1 : 0);
                  if (count > 0) {
                    return (
                      <span key={relation.field} className={`font-medium ${relation.color}`}>
                        {relation.prefix} {count} {relation.label}
                      </span>
                    );
                  }
                  return null;
                })}

                {/* Favoritter */}
                {viewOptions.showFavorites && entity.favorittAvBrukere?.length > 0 && (
                  <span className="text-yellow-600 font-medium">
                    ★ {entity.favorittAvBrukere.length} favoritter
                  </span>
                )}
                
                {/* File attachments */}
                {viewOptions.showRelations && entity.files?.length > 0 && (
                  <span>{entity.files.length} vedlegg</span>
                )}
              </div>
            </div>
          </div>

          {/* Status section on the right */}
          <div className="pl-6 min-w-[160px] relative">
            <div className="space-y-2 text-xs">
              {viewOptions.showVurdering && getVurderingDisplay(entity) && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 w-16 flex-shrink-0 font-medium">Vurdering:</span>
                  <div style={{ color: getVurderingDisplay(entity).color }}>
                    {getIcon(getVurderingDisplay(entity).icon, 12)}
                  </div>
                  <span className="text-gray-900 font-medium">{getVurderingDisplay(entity).text}</span>
                </div>
              )}
              
              {viewOptions.showStatus && getStatusDisplay(entity) && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 w-16 flex-shrink-0 font-medium">Status:</span>
                  <div style={{ color: getStatusDisplay(entity).color }}>
                    {getIcon(getStatusDisplay(entity).icon, 12)}
                  </div>
                  <span className="text-gray-900 font-medium">{getStatusDisplay(entity).text}</span>
                </div>
              )}
              
              {viewOptions.showPrioritet && getPrioritetDisplay(entity) && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 w-16 flex-shrink-0 font-medium">Prioritet:</span>
                  <div style={{ color: getPrioritetDisplay(entity).color }}>
                    {getIcon(getPrioritetDisplay(entity).icon, 12)}
                  </div>
                  <span className="text-gray-900 font-medium">{getPrioritetDisplay(entity).text}</span>
                </div>
              )}
              
              {viewOptions.showObligatorisk && entity.obligatorisk !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 w-16 flex-shrink-0 font-medium">Type:</span>
                  <div 
                    className={`flex-shrink-0 ${entity.obligatorisk ? 'text-blue-600' : 'text-green-600'}`}
                  >
                    {getIcon("Check", 12)}
                  </div>
                  <span className="text-gray-900 font-medium">
                    {entity.obligatorisk ? "Obligatorisk" : "Valgfri"}
                  </span>
                </div>
              )}
            </div>
            
            {/* View Details Button - Only show when selected */}
            {isSelected && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the card click
                    handleDoubleClick();
                  }}
                  className="w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Vis detaljer
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 📋 SPLIT MODE - Compact table-like layout */
        <>
          {/* Line 1: Complete metadata header - Entity type + UID + Status indicators */}
          <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
            {/* Left side: Entity type + UID + References */}
            <div className="flex items-center gap-2 flex-shrink-0 min-w-0 overflow-hidden">
              {/* Entity type indicator */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeColor}`}>
                {config.badgeText}
              </span>
              
              {/* UID */}
              {uid && (
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${config.badgeColor}`}>
                  [{uid}]
                </span>
              )}

              {/* Special reference (e.g., generalTiltak) */}
              {getSpecialReference(entity)}

              {/* Parent reference for child elements */}
              {getParentReference(entity)}
            </div>

            {/* Right side: Status indicators */}
            <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
              {viewOptions.showVurdering && <StatusIndicator display={getVurderingDisplay(entity)} iconOnly />}
              {viewOptions.showStatus && <StatusIndicator display={getStatusDisplay(entity)} iconOnly />}
              {viewOptions.showPrioritet && <StatusIndicator display={getPrioritetDisplay(entity)} iconOnly />}
              
              {/* Obligatorisk indicator */}
              {viewOptions.showObligatorisk && entity.obligatorisk !== undefined && (
                <div 
                  className={`flex-shrink-0 ${entity.obligatorisk ? 'text-blue-600' : 'text-green-600'}`} 
                  title={entity.obligatorisk ? "Obligatorisk" : "Valgfri"}
                >
                  {getIcon("Check", 12)}
                </div>
              )}
            </div>
          </div>

          {/* Line 2: Title (full width, prominent) */}
          <div className="mb-1">
            <span className="font-medium text-gray-900">{title}</span>
          </div>

          {/* Line 3: Description preview (full width, readable) */}
          {(entity.beskrivelseSnippet || entity.descriptionSnippet) && (
            <div className="text-sm text-gray-600 mb-2">
              {truncateText(getDescription())}
            </div>
          )}

          {/* Merknad if defined and enabled */}
          {viewOptions.showMerknad && entity.merknad && (
            <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2">
              <span className="text-xs font-medium text-amber-800">Merknad:</span> {truncateText(entity.merknad, 100)}
            </div>
          )}

          {/* Footer: Meta info and relations */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {/* Child count */}
              {viewOptions.showRelations && entity.children?.length > 0 && (
                <span className="text-emerald-600 font-medium">
                  {entity.children.length} {config.childrenLabel || "underelementer"}
                </span>
              )}
              
              {/* Related entities */}
              {config.relations && config.relations.map((relation) => {
                const count = Array.isArray(entity[relation.field]) ? entity[relation.field].length : (entity[relation.field] ? 1 : 0);
                if (count > 0) {
                  return (
                    <span key={relation.field} className={`font-medium ${relation.color}`}>
                      {relation.prefix} {count} {relation.label}
                    </span>
                  );
                }
                return null;
              })}

              {/* Favoritter - if shown */}
              {viewOptions.showFavorites && entity.favorittAvBrukere?.length > 0 && (
                <span className="text-yellow-600 font-medium">
                  ★ {entity.favorittAvBrukere.length} favoritter
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
        </>
      )}
      </div>
    </div>
  );
};

export default EntityCard;