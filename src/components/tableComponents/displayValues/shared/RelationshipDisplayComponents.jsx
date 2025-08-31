// Reusable relationship display components for parent and multi-relationship fields
import React from "react";
import { Badge } from "../../../ui/primitives/badge";


/**
 * Enhanced parent entity display with styling consistent across entity types
 * @param {Object} parent - Parent entity object
 * @param {string} entityType - Type of entity (tiltak, prosjektTiltak, krav, prosjektKrav)
 * @param {string} emptyText - Text to show when no parent exists
 */
export const EnhancedParentDisplay = ({ parent, entityType, emptyText }) => {
  if (!parent) {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>;
  }

  // Get the UID field name based on entity type
  const getUidField = (type) => {
    switch (type) {
      case 'tiltak':
        return 'tiltakUID';
      case 'prosjektTiltak':
        return 'tiltakUID';
      case 'krav':
        return 'kravUID';
      case 'prosjektKrav':
        return 'kravUID';
      default:
        return 'id';
    }
  };

  const uidField = getUidField(entityType);
  const uid = String(parent[uidField] || '');
  const title = String(parent.tittel || parent.navn || parent.name || '');
  // Use only the snippet version, never the full beskrivelse (which is TipTap rich text)
  const description = String(parent.beskrivelseSnippet || '');
  

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-start gap-2">
        <Badge variant="secondary" className="text-xs font-mono shrink-0">
          {uid}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 mb-1">{title}</div>
          {description && (
            <div className="text-xs text-gray-600 line-clamp-2">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced relationship list display for multi-select relationships
 * @param {Array} items - Array of related entities
 * @param {string} entityType - Type of related entities (krav, prosjektKrav)
 * @param {string} emptyText - Text to show when no items exist
 */
export const EnhancedRelationshipListDisplay = ({ items, entityType, emptyText }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>;
  }

  // Get the UID field name based on entity type
  const getUidField = (type) => {
    switch (type) {
      case 'krav':
        return 'kravUID';
      case 'prosjektKrav':
        return 'kravUID';
      case 'tiltak':
        return 'tiltakUID';
      case 'prosjektTiltak':
        return 'tiltakUID';
      default:
        return 'id';
    }
  };

  const uidField = getUidField(entityType);

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const uid = String(item[uidField] || '');
        const title = String(item.tittel || item.navn || item.name || '');
        // Use only the snippet version, never the full beskrivelse (which is TipTap rich text)
        const description = String(item.beskrivelseSnippet || '');
        

        return (
          <div key={item.id || index} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="text-xs font-mono shrink-0">
                {uid}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 mb-1">{title}</div>
                {description && (
                  <div className="text-xs text-gray-600 line-clamp-2">{description}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * String format display for parent relationships (for non-REACT contexts)
 * @param {Object} parent - Parent entity object
 * @param {string} entityType - Type of entity
 * @param {string} fieldValue - Raw field value (ID)
 * @param {string} emptyText - Text to show when no parent exists
 */
export const getParentDisplayString = (parent, entityType, fieldValue, emptyText) => {
  if (parent) {
    const getUidField = (type) => {
      switch (type) {
        case 'tiltak':
        case 'prosjektTiltak':
          return 'tiltakUID';
        case 'krav':
        case 'prosjektKrav':
          return 'kravUID';
        default:
          return 'id';
      }
    };

    const uidField = getUidField(entityType);
    const uid = parent[uidField];
    const title = parent.tittel || parent.navn || parent.name;

    if (uid && title) {
      return `${uid} - ${title}`;
    } else if (title) {
      return title;
    } else if (uid) {
      return uid;
    }
  } else if (fieldValue) {
    const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    return `${entityLabel} ID: ${fieldValue}`;
  }

  return emptyText;
};

/**
 * String format display for relationship lists (for non-REACT contexts)
 * @param {Array} items - Array of related entities
 * @param {string} entityType - Type of related entities
 * @param {string} emptyText - Text to show when no items exist
 */
export const getRelationshipDisplayString = (items, entityType, emptyText) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return emptyText;
  }

  const getUidField = (type) => {
    switch (type) {
      case 'krav':
      case 'prosjektKrav':
        return 'kravUID';
      case 'tiltak':
      case 'prosjektTiltak':
        return 'tiltakUID';
      default:
        return 'id';
    }
  };

  const uidField = getUidField(entityType);

  return items
    .map((item) => {
      const uid = item[uidField];
      const title = item.tittel || item.navn || item.name;
      return uid && title ? `${uid} - ${title}` : title || uid || `ID: ${item.id}`;
    })
    .join(", ");
};