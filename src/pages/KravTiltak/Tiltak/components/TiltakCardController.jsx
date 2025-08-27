import React from "react";
import { Button } from "@/components/ui/primitives/button";
import { CardWrapper } from "@/components/ui/layout/card-wrapper";
import { 
  Edit, 
  Trash2, 
  Settings, 
  FileText, 
  Users, 
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Calendar,
  User
} from "lucide-react";
import TiltakUnifiedField from "./TiltakUnifiedField";
import MerknadField from "../../shared/MerknadField";
import { tiltak as tiltakConfig } from "@/modelConfigs/models/tiltak.js";
import { updateTiltakMerknad } from "@/api/endpoints";

/**
 * TiltakCardController - Main card component for displaying and managing tiltak
 * Handles both collapsed and expanded states, view and edit modes
 */
const TiltakCardController = ({
  tiltak,
  isExpanded = false,
  expandedMode = "view", // 'view', 'edit', 'create'
  onExpand,
  onCollapse,
  onEdit,
  onDelete,
  onSave,
  onMerknadUpdate,
  onStatusChange,
  onVurderingChange,
  onPrioritetChange,
  onNavigateToTiltak,
  showMerknader = false,
  showStatus = true,
  showVurdering = true,
  showPrioritet = true,
  filesCount = 0,
  childrenCount = 0,
  parentTiltak = null,
}) => {
  const isCreateMode = expandedMode === "create";
  const isEditMode = expandedMode === "edit";
  const isViewMode = expandedMode === "view";

  // Get form fields for edit/create modes
  const formFields = tiltakConfig.fields.filter(field => {
    if (isCreateMode) return !field.hiddenCreate;
    if (isEditMode) return !field.hiddenEdit;
    return true;
  });

  // Handle card click (toggle expand/collapse)
  const handleCardClick = (e) => {
    console.log("TiltakCard clicked:", { tiltakId: tiltak.id, isExpanded, tiltak });
    e?.stopPropagation();
    
    if (isExpanded) {
      console.log("Collapsing tiltak:", tiltak.id);
      onCollapse(tiltak.id);
    } else {
      console.log("Expanding tiltak:", tiltak.id);
      onExpand(tiltak, "view");
    }
  };

  // Render collapsed card view
  if (!isExpanded) {
    return (
      <CardWrapper 
        className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
          tiltak.parentId ? "border-l-4 border-l-blue-400" : ""
        }`}
        onClick={handleCardClick}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border">
                  {tiltak.tiltakUID || "NY"}
                </span>
                {tiltak.obligatorisk && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Obligatorisk
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                {tiltak.tittel || "Nytt tiltak"}
              </h3>
              
              {tiltak.beskrivelseSnippet && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {tiltak.beskrivelseSnippet}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                {filesCount > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {filesCount}
                  </div>
                )}
                {childrenCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {childrenCount}
                  </div>
                )}
                {parentTiltak && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Under {parentTiltak.tittel}
                  </div>
                )}
                {tiltak.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(tiltak.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </CardWrapper>
    );
  }

  // Render expanded card view
  return (
    <CardWrapper className={`${tiltak.parentId ? "border-l-4 border-l-blue-400" : ""}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border">
                {tiltak.tiltakUID || "NY"}
              </span>
              {tiltak.obligatorisk && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Obligatorisk
                </span>
              )}
            </div>
            
            {!isEditMode && !isCreateMode && (
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {tiltak.tittel}
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isCreateMode && !isEditMode && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(tiltak)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDelete(tiltak)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onCollapse(tiltak.id)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content based on mode */}
        {isEditMode || isCreateMode ? (
          // Edit/Create Form
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formFields.map((field) => (
                <TiltakUnifiedField
                  key={field.name}
                  field={field}
                  value={tiltak[field.name]}
                  data={tiltak}
                  mode={expandedMode}
                  onChange={(value) => {
                    tiltak[field.name] = value;
                  }}
                  className={field.type === 'richtext' || field.type === 'basicrichtext' ? "md:col-span-2" : ""}
                />
              ))}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => onCollapse(tiltak.id)}
              >
                Avbryt
              </Button>
              <Button 
                onClick={() => onSave(tiltak)}
              >
                {isCreateMode ? "Opprett" : "Lagre"}
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tiltakConfig.fields
                .filter(field => !field.hiddenIndex && field.name !== 'tiltakUID')
                .map((field) => (
                  <TiltakUnifiedField
                    key={field.name}
                    field={field}
                    value={tiltak[field.name]}
                    data={tiltak}
                    mode="view"
                    className={field.type === 'richtext' || field.type === 'basicrichtext' ? "md:col-span-2" : ""}
                  />
                ))}
            </div>

            {/* Merknad Field */}
            {showMerknader && (
              <MerknadField
                entity={tiltak}
                onMerknadUpdate={onMerknadUpdate}
                updateEndpoint={updateTiltakMerknad}
                merknadField="merknad"
                className="mt-4"
              />
            )}
          </div>
        )}
      </div>
    </CardWrapper>
  );
};

export default TiltakCardController;