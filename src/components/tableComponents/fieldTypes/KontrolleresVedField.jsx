import React, { useMemo } from "react";
import { InfoIcon } from "@/components/ui/InfoIcon.jsx";
import { MultiSelect } from "@/components/ui/form/MultiSelect";

const DEFAULTS = [
  "Dokumentgjennomgang",
  "Visuell inspeksjon",
];

function parseValue(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Backward compat: plain text becomes single entry
  }
  return value.trim() ? [value.trim()] : [];
}

export default function KontrolleresVedField({
  field,
  value,
  onChange,
  error,
  isEditing,
  availableEntities = [],
}) {
  const selectedItems = useMemo(() => parseValue(value), [value]);

  // Build options: project custom entries (sorted by frequency) + defaults
  const options = useMemo(() => {
    const usageCounts = new Map();
    const customItems = new Map();

    availableEntities.forEach((entity) => {
      const items = parseValue(entity.kontrolleresVed);
      items.forEach((item) => {
        usageCounts.set(item, (usageCounts.get(item) || 0) + 1);
        if (!DEFAULTS.includes(item)) {
          customItems.set(item, (customItems.get(item) || 0) + 1);
        }
      });
    });

    // Project custom items sorted by frequency
    const projectOptions = [...customItems.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => ({
        value: item,
        label: item,
        description: "Brukt i prosjektet",
      }));

    // Defaults sorted by project usage frequency
    const defaultOptions = [...DEFAULTS]
      .sort((a, b) => {
        const aCount = usageCounts.get(a) || 0;
        const bCount = usageCounts.get(b) || 0;
        if (aCount !== bCount) return bCount - aCount;
        return DEFAULTS.indexOf(a) - DEFAULTS.indexOf(b);
      })
      .map((item) => ({
        value: item,
        label: item,
      }));

    // Include any selected items not in defaults or project
    const knownValues = new Set([...DEFAULTS, ...customItems.keys()]);
    const orphanOptions = selectedItems
      .filter((item) => !knownValues.has(item))
      .map((item) => ({
        value: item,
        label: item,
        description: "Egendefinert",
      }));

    return [...orphanOptions, ...projectOptions, ...defaultOptions];
  }, [availableEntities, selectedItems]);

  const emitChange = (newSelection) => {
    onChange({
      target: {
        name: field.name,
        value: newSelection.length > 0 ? JSON.stringify(newSelection) : "",
        type: "text",
      },
    });
  };

  // View mode
  if (!isEditing) {
    if (selectedItems.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {field.label}
          </label>
          <InfoIcon info={field.field_info} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-2.5 py-1 text-sm rounded-md bg-slate-100 text-slate-700 border border-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {field.label}
        </label>
        <InfoIcon info={field.field_info} />
      </div>

      <MultiSelect
        options={options}
        selectedValues={selectedItems}
        onSelectionChange={emitChange}
        placeholder="Velg kontrollmetode..."
        searchPlaceholder="Søk eller legg til metode..."
        emptyMessage="Ingen metoder funnet"
        allowCreate
        createLabel="Legg til"
      />

      {error && (
        <div className="text-sm text-red-600 font-normal">{error}</div>
      )}
    </div>
  );
}
