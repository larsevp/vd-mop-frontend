/**
 * EntityDetailHeader - Header section of entity detail panel
 * Extracted from EntityDetailPane - preserving exact functionality
 */

import React from 'react';
import { Edit, X, Save, RotateCcw, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EntityDetailHeader = ({
  entity,
  entityType,
  isEditing,
  isNewEntity,
  editData,
  hasChanges,
  title,
  uid,
  uidField,
  onFieldChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onClose,
  canEdit,
  canDelete
}) => {
  const navigate = useNavigate();

  const handleExternalLink = () => {
    const baseUrl = window.location.origin;
    const entityRouteMap = {
      'krav': 'krav',
      'tiltak': 'tiltak', 
      'prosjektKrav': 'prosjektKrav',
      'prosjektTiltak': 'prosjektTiltak'
    };
    
    const route = entityRouteMap[entityType] || entityType;
    const url = `${baseUrl}/${route}/${entity.id}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`flex-shrink-0 px-6 py-4 border-b border-gray-200 transition-colors ${isEditing ? "bg-blue-50" : "bg-white"}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/*<span className="text-xs text-gray-500">{entity.emne?.tittel || entity.kategori?.navn}</span>*/}
            {/*entity.obligatorisk ? (
              <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full">Obligatorisk</span>
            ) : (
              <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-full">Valgfri</span>
            )*/}
          </div>
          {/* Title - editable in edit mode */}
          <div className="flex items-center gap-3">
            {uidField && <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{uid}</span>}
            {isEditing ? (
              <input
                type="text"
                value={editData.tittel}
                onChange={(e) => onFieldChange("tittel", e.target.value)}
                className="text-xl font-semibold text-gray-900 leading-tight flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tittel..."
              />
            ) : (
              <h1 className="text-xl font-semibold text-gray-900 leading-tight">{title}</h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                disabled={!isNewEntity && !hasChanges}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Lagre (trykk Enter)"
              >
                <Save className="w-4 h-4 mr-1.5 inline" />
                {isNewEntity ? "Lagre" : "Oppdater"}
              </button>
              <button
                onClick={onCancel}
                tabIndex={-1}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Avbryt (trykk Esc)"
              >
                <RotateCcw className="w-4 h-4 mr-1.5 inline" />
                Avbryt
              </button>
              {!isNewEntity && canDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Slett"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Rediger (trykk E)"
                >
                  <Edit className="w-4 h-4 mr-1.5 inline" />
                  Rediger
                </button>
              )}
              
              {!isNewEntity && (
                <button
                  onClick={handleExternalLink}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Åpne i nytt vindu"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Lukk"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit mode indicator */}
      {isEditing && <div className="mt-3 text-xs text-blue-700">Redigeringsmodus - trykk Enter for å lagre eller Esc for å avbryte</div>}

      {/* Subtle keyboard hint when not editing */}
      {!isEditing && <div className="mt-3 text-xs text-gray-500">Trykk E for å redigere</div>}
    </div>
  );
};

export default EntityDetailHeader;