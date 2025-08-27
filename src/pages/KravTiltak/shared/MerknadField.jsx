import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Edit3, Check, X } from "lucide-react";

/**
 * Generic MerknadField component for displaying and directly editing merknad
 * Supports inline editing without opening full form
 * Can be used for any entity type (krav, tiltak, etc.)
 */
const MerknadField = ({ 
  entity, 
  onMerknadUpdate, 
  updateEndpoint,  // Function to call for saving merknad
  className = "",
  merknadField = "merknader" // Field name to use for merknad (default: "merknader")
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(entity[merknadField] || "");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync local state when entity prop changes (e.g., from parent updates)
  useEffect(() => {
    setValue(entity[merknadField] || "");
  }, [entity[merknadField], merknadField]);

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsEditing(true);
    setValue(entity[merknadField] || "");
  };

  const handleCancel = (e) => {
    e?.stopPropagation();
    setIsEditing(false);
    setValue(entity[merknadField] || "");
  };

  const handleSave = async (e) => {
    e?.stopPropagation();
    setLoading(true);
    
    try {
      // Check if entity has a valid ID
      if (!entity?.id) {
        console.error("Cannot save merknad: entity ID is missing");
        setValue(entity[merknadField] || "");
        setIsEditing(false);
        return;
      }

      // Use the provided update endpoint
      if (updateEndpoint) {
        const response = await updateEndpoint(entity.id, value.trim());
      }
      
      // Update the entity object locally so the display shows the new value
      entity[merknadField] = value.trim();
      
      // Notify parent of the merknad update for local state sync
      if (onMerknadUpdate) {
        onMerknadUpdate(entity.id, value.trim());
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving merknad:", error);
      // Reset to original value on error
      setValue(entity[merknadField] || "");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave(e);
    } else if (e.key === "Escape") {
      handleCancel(e);
    }
  };

  // Don't render if no valid entity ID (e.g., create-new placeholder)
  if (!entity?.id || entity.id === "create-new") {
    return null;
  }

  // Show "Add merknad" button if no merknad and not editing
  const hasContent = entity[merknadField] && entity[merknadField].trim();

  return (
    <div className={`${className}`} onClick={(e) => e.stopPropagation()}>
      {isEditing ? (
        <div className="border border-blue-200 bg-blue-50/30 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-400"
              placeholder="Legg til en merknad..."
              rows={2}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Avbryt"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
              title="Lagre"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ) : hasContent ? (
        <div 
          className="border border-slate-200 bg-slate-50/30 rounded-lg p-3 cursor-pointer hover:border-slate-300 hover:bg-slate-50/60 transition-all group"
          onClick={handleEdit}
          title="Klikk for å redigere merknad"
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-relaxed break-words">
                {entity[merknadField]}
              </p>
            </div>
            <Edit3 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
          </div>
        </div>
      ) : (
        <div 
          className="border border-slate-200 bg-slate-50/30 rounded-md px-2 py-1.5 cursor-pointer hover:border-slate-300 hover:bg-slate-50/60 transition-all group"
          onClick={handleEdit}
          title="Klikk for å legge til merknad"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3 w-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-500 group-hover:text-slate-600">Legg til merknad</span>
            <Edit3 className="h-2.5 w-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MerknadField;