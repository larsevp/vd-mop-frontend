import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { TiptapDisplay } from '@/components/ui/editor/TiptapDisplay';
import { FieldResolver } from '@/components/tableComponents/fieldTypes/fieldResolver';

/**
 * Rich text field that shows as read-only display by default.
 * Click the pencil or double-click the content to enter edit mode with full toolbar.
 * Blurring out of the editor returns to display mode.
 */
const EditableRichField = ({ fieldName, fieldConfig, entity, formData, handleFieldChange, debouncedSave, immediateSave, extractValue }) => {
  const [editing, setEditing] = useState(false);
  const wrapperRef = useRef(null);

  const value = formData[fieldName] ?? entity[fieldName] ?? '';
  const hasContent = value && value !== '<p></p>' && value.replace(/<[^>]*>/g, '').trim();

  const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, entity.entityType);

  const enterEdit = useCallback(() => setEditing(true), []);

  // Exit edit on blur outside wrapper
  const handleBlur = useCallback((e) => {
    // Stay in edit if focus is still within the wrapper (e.g. clicking toolbar buttons)
    if (wrapperRef.current?.contains(e.relatedTarget)) return;
    // Small delay to allow toolbar button clicks to register
    setTimeout(() => {
      if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
        setEditing(false);
        // Save on exit
        const currentVal = formData[fieldName] ?? entity[fieldName] ?? '';
        immediateSave(fieldName, currentVal);
      }
    }, 200);
  }, [fieldName, formData, entity, immediateSave]);

  if (editing) {
    return (
      <div ref={wrapperRef} onBlur={handleBlur} onClick={(e) => e.stopPropagation()}>
        <FieldComponent
          field={fieldConfig}
          value={value}
          onChange={(eventOrValue) => {
            handleFieldChange(eventOrValue);
            debouncedSave(fieldName, extractValue(eventOrValue));
          }}
          className="text-sm"
          error={null}
        />
      </div>
    );
  }

  // Display mode
  return (
    <div
      className="group relative cursor-pointer rounded-md hover:bg-slate-50 transition-colors min-h-[28px]"
      onDoubleClick={enterEdit}
    >
      {hasContent ? (
        <div className="text-sm">
          <TiptapDisplay content={value} className="text-sm" />
        </div>
      ) : (
        <p className="text-sm text-slate-300 italic py-1">Tomt — dobbeltklikk for å redigere</p>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); enterEdit(); }}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200"
        title="Rediger"
      >
        <Pencil className="w-3 h-3 text-slate-400" />
      </button>
    </div>
  );
};

export default EditableRichField;
