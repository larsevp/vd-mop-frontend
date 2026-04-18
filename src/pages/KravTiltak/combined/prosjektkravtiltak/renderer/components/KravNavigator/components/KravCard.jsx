import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { FieldResolver } from '@/components/tableComponents/fieldTypes/fieldResolver';
import { DisplayValueResolver } from '@/components/tableComponents/displayValues/DisplayValueResolver';
import { getModelConfig } from '@/modelConfigs';
import { useEntityForm } from '@/pages/KravTiltak/shared/components/EntityDetailPane/helpers';
import { getStatusDisplay, getVurderingDisplay, getPrioritetDisplay } from '@/pages/KravTiltak/shared/utils/statusHelpers';
import TruncatedRichText from './TruncatedRichText';

const STATUS_FIELDS = [
  { name: 'statusId', label: 'Status', getDisplay: getStatusDisplay },
  { name: 'vurderingId', label: 'Vurdering', getDisplay: getVurderingDisplay },
  { name: 'prioritet', label: 'Prioritet', getDisplay: getPrioritetDisplay },
];

const KravCard = ({ krav, emne, onFieldSave, editing }) => {
  const modelConfigKey = 'prosjektKrav';
  const modelConfig = getModelConfig(modelConfigKey);
  const allFields = modelConfig?.fields || [];
  const articleViewConfig = modelConfig?.workspace?.articleView || {
    mainContentFields: ['beskrivelse', 'informasjon'],
    statusFields: ['vurderingId', 'statusId', 'prioritet'],
  };

  const { formData, handleFieldChange } = useEntityForm(krav, allFields, modelConfigKey);
  const saveTimeoutRef = useRef(null);

  const debouncedSave = useCallback((fieldName, value) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onFieldSave(fieldName, value, krav);
    }, 1500);
  }, [onFieldSave, krav]);

  const immediateSave = useCallback((fieldName, value) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    onFieldSave(fieldName, value, krav);
  }, [onFieldSave, krav]);

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
    const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, krav.entityType);
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <FieldComponent
          field={fieldConfig}
          value={formData[fieldName] ?? krav[fieldName] ?? ''}
          onChange={(eventOrValue) => {
            handleFieldChange(eventOrValue);
            const val = extractValue(eventOrValue);
            opts.immediate ? immediateSave(fieldName, val) : debouncedSave(fieldName, val);
          }}
          onBlur={(eventOrValue) => {
            immediateSave(fieldName, extractValue(eventOrValue) || (formData[fieldName] ?? krav[fieldName] ?? ''));
          }}
          className={opts.className || 'text-sm'}
          error={null}
        />
      </div>
    );
  };

  const uid = krav.kravUID || krav.uid;
  const title = krav.tittel || krav.title || krav.navn || '';

  const isRichText = (fieldName) => {
    const fc = allFields.find(f => f.name === fieldName);
    return fc && (fc.type === 'richtext' || fc.type === 'basicrichtext');
  };

  const renderContentView = (fieldName) => {
    const value = krav[fieldName];
    const fieldConfig = allFields.find(f => f.name === fieldName);
    if (!fieldConfig) return null;

    if (isRichText(fieldName)) {
      return <TruncatedRichText content={value} />;
    }

    return (
      <div className="text-sm text-slate-700">
        {DisplayValueResolver.getDisplayComponent(krav, fieldConfig, 'DETAIL', krav.entityType)}
      </div>
    );
  };

  const renderStatusView = () => (
    <div className="flex flex-wrap gap-x-5 gap-y-1">
      {STATUS_FIELDS.map(({ name, label, getDisplay }) => {
        if (!articleViewConfig.statusFields?.includes(name)) return null;
        const display = getDisplay(krav);
        return (
          <div key={name} className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>
            {display ? (
              <span className="text-xs font-medium" style={{ color: display.color }}>
                {display.text}
              </span>
            ) : (
              <span className="text-xs text-slate-300">—</span>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStatusEdit = () => (
    <div className="flex flex-wrap gap-4">
      {STATUS_FIELDS.map(({ name, label }) => {
        if (!articleViewConfig.statusFields?.includes(name)) return null;
        const fieldConfig = allFields.find(f => f.name === name);
        if (!fieldConfig) return null;
        const FieldComponent = FieldResolver.getFieldComponent(fieldConfig, krav.entityType);
        return (
          <div key={name} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-slate-400">{label}:</span>
            <div className="w-32">
              <FieldComponent
                field={fieldConfig}
                value={formData[name] ?? krav[name] ?? ''}
                onChange={(eventOrValue) => {
                  handleFieldChange(eventOrValue);
                  immediateSave(name, extractValue(eventOrValue));
                }}
                className="text-xs"
                error={null}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const [revealedFields, setRevealedFields] = useState([]);
  useEffect(() => { if (!editing) setRevealedFields([]); }, [editing]);

  const primaryField = articleViewConfig.mainContentFields[0]; // 'beskrivelse'
  const secondaryFields = articleViewConfig.mainContentFields.slice(1); // ['informasjon']
  const visibleSecondaryFields = secondaryFields.filter(fn => krav[fn] || revealedFields.includes(fn));
  const hiddenSecondaryFields = editing
    ? secondaryFields.filter(fn => !krav[fn] && !revealedFields.includes(fn))
    : [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {uid && <span className="text-[10px] font-mono text-slate-400">{uid}</span>}
            {editing ? (
              renderEditableField('tittel', { className: 'text-lg font-semibold' })
            ) : (
              <h2 className="text-lg font-semibold text-slate-900 leading-snug">{title}</h2>
            )}
          </div>
        </div>

        {/* Status row */}
        <div className="mt-2">
          {editing ? renderStatusEdit() : renderStatusView()}
        </div>
      </div>

      {/* Content fields */}
      <div className="px-5 pb-4 space-y-3 border-t border-slate-100 pt-3">
        {/* Beskrivelse — always shown, with label */}
        {(() => {
          const fieldConfig = allFields.find(f => f.name === primaryField);
          if (!fieldConfig) return null;
          return (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {fieldConfig.label}
              </h3>
              {editing ? renderEditableField(primaryField) : renderContentView(primaryField)}
            </div>
          );
        })()}

        {/* Secondary fields — only if they have content or were revealed */}
        {visibleSecondaryFields.map(fieldName => {
          const fieldConfig = allFields.find(f => f.name === fieldName);
          if (!fieldConfig) return null;
          return (
            <div key={fieldName}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {fieldConfig.label}
              </h3>
              {editing ? renderEditableField(fieldName) : renderContentView(fieldName)}
            </div>
          );
        })}

        {/* Add hidden field buttons in edit mode */}
        {hiddenSecondaryFields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hiddenSecondaryFields.map(fieldName => {
              const fieldConfig = allFields.find(f => f.name === fieldName);
              if (!fieldConfig) return null;
              return (
                <button
                  key={fieldName}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevealedFields(prev => [...prev, fieldName]);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2 py-1 rounded border border-dashed border-slate-300 hover:border-slate-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {fieldConfig.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KravCard;
