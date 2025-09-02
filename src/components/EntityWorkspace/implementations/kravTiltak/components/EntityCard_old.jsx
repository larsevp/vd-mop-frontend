import React, { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Edit, Trash2, AlertCircle, Clock, Paperclip, GitBranch, ArrowUp } from "lucide-react";
import { MerknadField } from "../shared";
import { EntityTypeResolver } from "../services/EntityTypeResolver";
import PrioritetDropdown from "@/pages/KravTiltak/Old/Krav_old/old/components/PrioritetDropdown";

/**
 * Generic EntityCard component that can render any entity type
 * Based on the KravCard but made generic using model configuration
 */
const EntityCard = ({
  entity,
  modelConfig,
  entityType,
  onEdit,
  onDelete,
  onView,
  onMerknadUpdate,
  onStatusChange,
  onVurderingChange,
  onPrioritetChange,
  showMerknader = false,
  showStatus = false,
  showVurdering = false,
  showPrioritet = false,
  filesCount = 0,
  childrenCount = 0,
  parentEntity = null,
  renderIcon,
}) => {
  // Loading states for individual dropdowns
  const [statusLoading, setStatusLoading] = useState(false);
  const [vurderingLoading, setVurderingLoading] = useState(false);
  const [prioritetLoading, setPrioritetLoading] = useState(false);

  // For combined views, use entity-specific model config if entity has entityType
  const effectiveModelConfig =
    entity.entityType && entity.entityType !== entityType ? EntityTypeResolver.resolveModelConfig(entity.entityType) : modelConfig;

  // Get entity display fields from effective model config
  const titleField =
    effectiveModelConfig.workspace?.cardFields?.find((f) => f === "tittel" || f === "title" || f === "navn" || f === "name") || "tittel";

  const uidField = effectiveModelConfig.workspace?.cardFields?.find((f) => f.toLowerCase().includes("uid") || f === "id");

  const descField =
    effectiveModelConfig.workspace?.cardFields?.find(
      (f) => f.toLowerCase().includes("beskrivelse") || f.toLowerCase().includes("description")
    ) || "beskrivelse"; // Fallback for combined views

  // Get display values
  const title = entity[titleField] || "Uten tittel";
  const uid = uidField ? entity[uidField] : `${entityType.toUpperCase()}${entity.id}`;
  const description = descField ? entity[`${descField}Snippet`] || entity[descField] : "";

  // Debug logging for parent data
  if (entity.parentId && entity.parent) {
    // Entity with parent: entityId, parentId, parent, entityType
  }

  // Handlers with loading states
  const handleStatusChange = async (newValue) => {
    if (!entity?.id || entity.id === "create-new") {
      console.error(`Cannot change status: ${entityType} ID is missing or invalid`);
      return;
    }
    setStatusLoading(true);
    try {
      await onStatusChange?.(entity.id, newValue);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleVurderingChange = async (newValue) => {
    if (!entity?.id || entity.id === "create-new") {
      console.error(`Cannot change vurdering: ${entityType} ID is missing or invalid`);
      return;
    }
    setVurderingLoading(true);
    try {
      await onVurderingChange?.(entity.id, newValue);
    } finally {
      setVurderingLoading(false);
    }
  };

  const handlePrioritetChange = async (newValue) => {
    if (!entity?.id || entity.id === "create-new") {
      console.error(`Cannot change prioritet: ${entityType} ID is missing or invalid`);
      return;
    }
    setPrioritetLoading(true);
    try {
      await onPrioritetChange?.(entity.id, newValue);
    } finally {
      setPrioritetLoading(false);
    }
  };

  const getPriorityDisplay = (prioritet) => {
    if (!prioritet) return { text: "Lav", color: "bg-gray-100 text-gray-600" };
    if (prioritet >= 30) return { text: "Høy", color: "bg-red-100 text-red-700" };
    if (prioritet >= 20) return { text: "Middels", color: "bg-yellow-100 text-yellow-700" };
    return { text: "Lav", color: "bg-green-100 text-green-700" };
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Check if this entity should be indented - logic depends on the view context
  const isCombinedView = entityType === "combinedEntities" || entityType === "combined";

  let shouldIndent = false;

  if (isCombinedView) {
    // Combined view: indent tiltak that are displayed under a krav or belong to a krav
    shouldIndent = entity._displayedUnderKrav === true || (entity.prosjektKrav && entity.prosjektKrav.length > 0);
  } else {
    // Regular views: use traditional indentation rules (only parent relationships)
    shouldIndent = entity.parentId;
  }

  return (
    <div
      className={`bg-white rounded-xl border hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer relative ${
        shouldIndent
          ? "border-l-4 border-l-blue-400 border-neutral-200 ml-6" // Add left margin for visual indentation
          : "border-neutral-200"
      }`}
      onClick={() => onView?.(entity)}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Hierarchical connection line for child elements */}
      {shouldIndent && <div className="absolute -left-6 top-8 w-4 h-px bg-blue-300"></div>}

      <div className="p-6 flex gap-6 relative">
        {/* Main content area - Title, UID, and Description */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title and UID row */}
          <div className="flex items-start gap-4">
            {uidField && (
              <span className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex-shrink-0 font-medium border border-blue-100">
                {uid}
              </span>
            )}
            <h3
              className="font-semibold text-gray-900 text-xl leading-tight flex-1 group-hover:text-blue-700 transition-colors"
              title={title}
            >
              {title}
            </h3>
          </div>

          {/* Parent reference for child elements */}
          {entity.parentId && entity.parent && (
            <div className="pl-1 flex items-center gap-2 text-sm text-blue-600 bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100">
              <ArrowUp size={14} className="text-blue-500" />
              <span className="font-medium">
                Overordnet: {entity.parent.tiltakUID || entity.parent.kravUID || entity.parent.id} -{" "}
                {entity.parent.tittel || entity.parent.navn}
              </span>
            </div>
          )}

          {/* Parent krav reference for tiltak in combined view */}
          {entity._displayedUnderKrav && entity._parentKrav && (
            <div className="pl-1 flex items-center gap-2 text-sm text-blue-600 bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100">
              <ArrowUp size={14} className="text-blue-500" />
              <span className="font-medium">
                ↑ {entity._parentKrav.kravUID || entity._parentKrav.id} - {entity._parentKrav.tittel}
              </span>
            </div>
          )}

          {/* ProsjektKrav relationship for ProsjektTiltak when hierarchy is shown */}
          {effectiveModelConfig?.ui?.showHierarchy &&
            (entityType === "prosjektTiltak" ||
              entityType === "ProsjektTiltak" ||
              entity.entityType === "prosjektTiltak" ||
              entity.entityType === "ProsjektTiltak") &&
            entity.prosjektKrav &&
            entity.prosjektKrav.length > 0 && (
              <div className="pl-1 flex items-center gap-2 text-sm text-green-600 bg-green-50/50 px-3 py-2 rounded-lg border border-green-100">
                <ArrowUp size={14} className="text-green-500" />
                <span className="font-medium">
                  Tilhører krav: {entity.prosjektKrav.map((krav) => `${krav.kravUID || krav.id} - ${krav.tittel || krav.navn}`).join(", ")}
                </span>
              </div>
            )}

          {/* Description */}
          {description && (
            <div className="pl-1">
              <p
                className="text-gray-600 leading-relaxed text-[15px] overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  maxHeight: "3rem",
                }}
              >
                {truncateText(description, 220)}
              </p>
            </div>
          )}

          {/* Merknad Field - Only show if showMerknader is true */}
          {showMerknader && (
            <div className="pl-1">
              <MerknadField entity={entity} onMerknadUpdate={onMerknadUpdate} className="mt-3" merknadField="merknader" />
            </div>
          )}
        </div>

        {/* Right sidebar - Status, badges, and actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0 min-w-[140px]">
          {/* Actionable Controls Row - All dropdowns grouped together */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Priority Dropdown */}
            {showPrioritet && entity?.id && entity.id !== "create-new" && (
              <PrioritetDropdown value={entity.prioritet} onChange={handlePrioritetChange} loading={prioritetLoading} />
            )}
          </div>

          {/* Status and Info badges row */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Obligatorisk/Valgfritt status badge */}
            {entity.obligatorisk !== undefined &&
              (entity.obligatorisk ? (
                <span className="text-xs text-red-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle size={14} />
                  Obligatorisk
                </span>
              ) : (
                <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                  <Clock size={14} />
                  Valgfritt
                </span>
              ))}

            {/* Parent relationship badge - More compact since we show full info above */}
            {entity.parentId && (
              <span
                className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-indigo-100"
                title={
                  entity.parent
                    ? `Datter${entityType} av: ${entity.parent.tiltakUID || entity.parent.kravUID || entity.parent.id} - ${
                        entity.parent.tittel || entity.parent.navn
                      }`
                    : `Datter${entityType}`
                }
              >
                <ArrowUp size={11} />
                Under{entityType}
              </span>
            )}

            {/* Children count badge */}
            {childrenCount > 0 && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-emerald-100">
                <GitBranch size={11} />
                {childrenCount} under{entityType}
              </span>
            )}

            {/* Files count badge */}
            {filesCount > 0 && (
              <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-amber-100">
                <Paperclip size={11} />
                {filesCount} {filesCount === 1 ? "fil" : "filer"}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-auto transform translate-y-1 group-hover:translate-y-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(entity);
              }}
              className="h-9 px-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Rediger"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(entity);
              }}
              className="h-9 px-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Slett"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityCard;
