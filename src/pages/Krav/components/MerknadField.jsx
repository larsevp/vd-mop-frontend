import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Edit3, Check, X } from "lucide-react";

/**
 * MerknadField component for displaying and directly editing merknad
 * Supports inline editing without opening full form
 */
const MerknadField = ({ 
  krav, 
  onSave, 
  className = "" 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(krav.merknader || "");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    setIsEditing(true);
    setValue(krav.merknader || "");
  };

  const handleCancel = (e) => {
    e?.stopPropagation();
    setIsEditing(false);
    setValue(krav.merknader || "");
  };

  const handleSave = async (e) => {
    e?.stopPropagation();
    setLoading(true);
    
    try {
      await onSave({ ...krav, merknader: value.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving merknad:", error);
      // Reset to original value on error
      setValue(krav.merknader || "");
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

  // Don't render if no merknad and not editing
  if (!krav.merknader && !isEditing) {
    return null;
  }

  return (
    <div className={`${className}`} onClick={(e) => e.stopPropagation()}>
      {isEditing ? (
        <div className="border-l-4 border-blue-300 bg-blue-50/30 rounded-r-lg p-3">
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
      ) : (
        <div 
          className="border-l-4 border-slate-300 bg-slate-50/50 rounded-r-lg p-3 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all group"
          onClick={handleEdit}
          title="Klikk for å redigere merknad"
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-relaxed break-words">
                {krav.merknader}
              </p>
            </div>
            <Edit3 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MerknadField;