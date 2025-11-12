import React from 'react';
import { truncateText } from '../EntityCard/helpers/textHelpers';

/**
 * EntityReference - Displays parent and connected entity references
 *
 * Shows:
 * - ↑ for parent references (hierarchical parent, general tiltak/krav)
 * - ↓ for connected children (prosjektTiltak connected to this krav, or children count)
 * - Both if entity has both parent and connected items
 *
 * All in grayscale.
 */
const EntityReference = ({ entity }) => {
  const references = [];

  // 1. Check for hierarchical parent (parentId) - ↑
  if (entity.parentId) {
    const parentTitle = entity.parent?.tittel || entity.parent?.title;
    const parentUID = entity.parent?.kravUID || entity.parent?.tiltakUID || entity.parent?.uid || entity.parent?.id;
    const entityTitle = entity.tittel || entity.title;

    // Only show if we have a valid parent title that's different from the entity's title
    if (parentTitle && parentTitle !== entityTitle) {
      const displayText = parentUID ? `${parentUID}: ${parentTitle}` : parentTitle;
      references.push(
        <span key="parent" className="text-xs text-slate-600 flex items-center">
          <span className="text-slate-500 mr-1">↑</span>
          {truncateText(displayText, 35)}
        </span>
      );
    }
  }

  // 2. Check for connected Krav parent (_parentKrav for Tiltak connected to Krav) - ↑
  if (entity._parentKrav) {
    const kravTitle = entity._parentKrav.tittel;
    const kravUID = entity._parentKrav.kravUID;

    if (kravTitle) {
      const displayText = kravUID ? `${kravUID}: ${kravTitle}` : kravTitle;
      references.push(
        <span key="parentKrav" className="text-xs text-slate-600 flex items-center">
          <span className="text-slate-500 mr-1">↑</span>
          {truncateText(displayText, 35)}
        </span>
      );
    }
  }

  // 3. Check for general tiltak/krav reference - ↑
  if (entity.generalTiltak) {
    references.push(
      <span key="generalTiltak" className="text-xs text-slate-600 flex items-center">
        <span className="text-slate-500 mr-1">↑</span>
        {truncateText(entity.generalTiltak.tittel || entity.generalTiltak.navn, 25)}
      </span>
    );
  }

  if (entity.generalKrav) {
    references.push(
      <span key="generalKrav" className="text-xs text-slate-600 flex items-center">
        <span className="text-slate-500 mr-1">↑</span>
        {truncateText(entity.generalKrav.tittel || entity.generalKrav.navn, 25)}
      </span>
    );
  }

  // 4. Check for connected children/tiltak - ↓
  const hasConnectedTiltak = Array.isArray(entity.prosjektTiltak) && entity.prosjektTiltak.length > 0;
  const hasConnectedKrav = Array.isArray(entity.prosjektKrav) && entity.prosjektKrav.length > 0;
  const hasChildren = Array.isArray(entity.children) && entity.children.length > 0;

  if (hasConnectedTiltak) {
    const count = entity.prosjektTiltak.length;
    references.push(
      <span key="connectedTiltak" className="text-xs text-slate-600 flex items-center">
        <span className="text-slate-500 mr-1">↓</span>
        {count} tilknyttet {count === 1 ? 'tiltak' : 'tiltak'}
      </span>
    );
  }

  if (hasConnectedKrav) {
    const count = entity.prosjektKrav.length;
    references.push(
      <span key="connectedKrav" className="text-xs text-slate-600 flex items-center">
        <span className="text-slate-500 mr-1">↓</span>
        {count} tilknyttet {count === 1 ? 'krav' : 'krav'}
      </span>
    );
  }

  if (hasChildren) {
    const count = entity.children.length;
    const entityType = entity.entityType?.toLowerCase();
    const isKrav = entityType?.includes('krav');
    const childLabel = isKrav ? (count === 1 ? 'underkrav' : 'underkrav') : (count === 1 ? 'undertiltak' : 'undertiltak');

    references.push(
      <span key="children" className="text-xs text-slate-600 flex items-center">
        <span className="text-slate-500 mr-1">↓</span>
        {count} {childLabel}
      </span>
    );
  }

  // Return all references with spacing between them
  if (references.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {references}
    </div>
  );
};

export default EntityReference;
