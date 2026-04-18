import React, { useRef, useCallback, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { FieldResolver } from '@/components/tableComponents/fieldTypes/fieldResolver';
import { DisplayValueResolver } from '@/components/tableComponents/displayValues/DisplayValueResolver';
import { getModelConfig } from '@/modelConfigs';
import { useEntityForm } from '@/pages/KravTiltak/shared/components/EntityDetailPane/helpers';
import { getStatusDisplay } from '@/pages/KravTiltak/shared/utils/statusHelpers';
import TruncatedRichText from './TruncatedRichText';

function parseJsonArray(value) {
  if (!value) return [];
  try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch {}
  return value?.trim() ? [value.trim()] : [];
}

const TiltakSubCard = ({ tiltak, onFieldSave, editing }) => {
  const modelConfigKey = 'prosjektTiltak';
  const modelConfig = getModelConfig(modelConfigKey);
  const allFields = modelConfig?.fields || [];
  const articleViewConfig = modelConfig?.workspace?.articleView || {};

  const { formData, handleFieldChange } = useEntityForm(tiltak, allFields, modelConfigKey);
  const saveTimeoutRef = useRef(null);

  const debouncedSave = useCallback((fieldName, value) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onFieldSave(fieldName, value, tiltak);
    }, 1500);
  }, [onFieldSave, tiltak]);

  const immediateSave = useCallback((fieldName, value) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    onFieldSave(fieldName, value, tiltak);
  }, [onFieldSave, tiltak]);

  useEffect(() => () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, []);


  const extractValue = (eventOrValue) => {
    if (typeof eventOrValue === 'object' && eventOrValue?.target) return eventOrValue.target.value;
    return eventOrValue;
  };

  const renderEditableField = (fieldName, opts = {}) => {
    const fieldConfig = allFields.find(f => f.name === fieldName);
    if (!fieldConfig) return null;
    const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, tiltak.entityType);
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <FieldComponent
          field={fieldConfig}
          value={formData[fieldName] ?? tiltak[fieldName] ?? ''}
          onChange={(eventOrValue) => {
            handleFieldChange(eventOrValue);
            const val = extractValue(eventOrValue);
            opts.immediate ? immediateSave(fieldName, val) : debouncedSave(fieldName, val);
          }}
          onBlur={(eventOrValue) => {
            immediateSave(fieldName, extractValue(eventOrValue) || (formData[fieldName] ?? tiltak[fieldName] ?? ''));
          }}
          className={opts.className || 'text-sm'}
          error={null}
        />
      </div>
    );
  };

  const isRichText = (fieldName) => {
    const fc = allFields.find(f => f.name === fieldName);
    return fc && (fc.type === 'richtext' || fc.type === 'basicrichtext');
  };

  const renderContentField = (fieldName) => {
    const value = tiltak[fieldName];
    const fieldConfig = allFields.find(f => f.name === fieldName);
    if (!fieldConfig) return null;

    if (editing) return renderEditableField(fieldName);

    if (isRichText(fieldName)) {
      return <TruncatedRichText content={value} />;
    }

    // For non-rich text (e.g. styrendeDokumentasjon JSON array)
    if (!value) return <span className="text-sm text-slate-300 italic">Tomt</span>;
    const isJsonArray = typeof value === 'string' && value.startsWith('[');
    if (isJsonArray) {
      const parsed = parseJsonArray(value);
      return <span className="text-sm text-slate-700">{parsed.join(', ')}</span>;
    }
    return (
      <div className="text-sm text-slate-700">
        {DisplayValueResolver.getDisplayComponent(tiltak, fieldConfig, 'DETAIL', tiltak.entityType)}
      </div>
    );
  };

  const uid = tiltak.tiltakUID || tiltak.uid;
  const title = tiltak.tittel || tiltak.title || tiltak.navn || '';
  const kontrollConfig = articleViewConfig.kontrollFields;

  // Status display
  const statusDisplay = getStatusDisplay(tiltak);

  // Filled kontroll fields
  const filledKontroll = kontrollConfig
    ? kontrollConfig.layout.flat().filter(fn => {
        const val = tiltak[fn];
        return val !== null && val !== undefined && val !== '' && val !== false;
      })
    : [];

  // Content fields to show
  const contentFields = ['implementasjon', 'styrendeDokumentasjon'].filter(fieldName => {
    if (editing) return true;
    return tiltak[fieldName];
  });

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Header: UID + Title + Status + Edit button */}
      <div className="px-4 py-2.5 flex items-center gap-2">
        {uid && <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{uid}</span>}

        {editing ? (
          <div className="flex-1 min-w-0">{renderEditableField('tittel', { className: 'text-sm font-medium' })}</div>
        ) : (
          <h3 className="flex-1 min-w-0 text-sm font-medium text-slate-900 truncate">{title}</h3>
        )}

        {filledKontroll.length > 0 && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}

        {/* Status — view or edit */}
        {editing ? (
          <div className="flex-shrink-0 w-28" onClick={(e) => e.stopPropagation()}>
            {renderEditableField('statusId', { immediate: true, className: 'text-xs' })}
          </div>
        ) : (
          <span className="flex-shrink-0 text-xs" style={{ color: statusDisplay?.color || '#94a3b8' }}>
            {statusDisplay?.text || 'Ingen status'}
          </span>
        )}

      </div>

      {/* Content */}
      {contentFields.length > 0 && (
        <div className="px-4 pb-3 space-y-2 border-t border-slate-100 pt-2">
          {contentFields.map(fieldName => {
            const fieldConfig = allFields.find(f => f.name === fieldName);
            if (!fieldConfig) return null;
            return (
              <div key={fieldName}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {fieldConfig.label}
                </span>
                {renderContentField(fieldName)}
              </div>
            );
          })}
        </div>
      )}

      {/* Kontroll fields — read-only summary */}
      {filledKontroll.length > 0 && !editing && (
        <div className="px-4 pb-3 border-t border-slate-100 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Kontroll
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {filledKontroll.map(fieldName => {
              const fieldConfig = allFields.find(f => f.name === fieldName);
              if (!fieldConfig) return null;
              const rawVal = tiltak[fieldName];
              const isJsonArray = typeof rawVal === 'string' && rawVal.startsWith('[');
              const displayVal = isJsonArray ? parseJsonArray(rawVal).join(', ') : rawVal;
              return (
                <div key={fieldName} className="flex items-baseline gap-1.5">
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{fieldConfig.label}:</span>
                  <span className="text-slate-700 truncate">{displayVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kontroll fields — editable in edit mode */}
      {editing && kontrollConfig && (
        <div className="px-4 pb-3 border-t border-slate-100 pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Kontroll
          </span>
          <div className="grid grid-cols-2 gap-3">
            {kontrollConfig.layout.flat().map(fieldName => {
              const fieldConfig = allFields.find(f => f.name === fieldName);
              if (!fieldConfig) return null;
              return (
                <div key={fieldName} onClick={(e) => e.stopPropagation()}>
                  <div className="text-[10px] text-slate-400 mb-0.5">{fieldConfig.label}</div>
                  {renderEditableField(fieldName)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TiltakSubCard;
