import React, { useMemo } from "react";
import { InfoIcon } from "@/components/ui/InfoIcon.jsx";
import { MultiSelect } from "@/components/ui/form/MultiSelect";

const DEFAULTS = [
  "MIL-R01 Miljøstyring i prosjekt",
  "MIL-R02 Kartlegging av miljøaspekter",
  "MIL-R03 BREEAM NOR i prosjektering og produksjon",
  "MIL-R08 Kjemikaliehåndtering",
  "MIL-R09 Miljøvurdering av produkter",
  "MIL-R10 Substitusjonsvurdering",
  "MIL-R11 Lagring av kjemikalier",
  "MIL-R12 Ressursutnyttelse og avfallsreduksjon",
  "MIL-R13 Avfallsplan",
  "MIL-R14 Miljøsanering og ombruk",
  "MIL-R15 Farlig avfall",
  "MIL-R17 Forurenset grunn",
  "MIL-R18 Rene naturlige masser",
  "MIL-R19 Støy og vibrasjoner",
  "MIL-R20 Kulturminner og kulturmiljø",
  "MIL-R21 Naturmangfold",
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

function getDocCode(doc) {
  const match = doc.match(/^(MIL-R\d+)/);
  return match ? match[1] : null;
}

export default function StyrendeDokumentasjonField({
  field,
  value,
  onChange,
  error,
  isEditing,
  availableEntities = [],
}) {
  const selectedDocs = useMemo(() => parseValue(value), [value]);

  // Build options: project custom docs (sorted by frequency) + defaults (sorted by project usage)
  const options = useMemo(() => {
    const usageCounts = new Map();
    const customDocs = new Map();

    availableEntities.forEach((entity) => {
      const docs = parseValue(entity.styrendeDokumentasjon);
      docs.forEach((doc) => {
        usageCounts.set(doc, (usageCounts.get(doc) || 0) + 1);
        if (!DEFAULTS.includes(doc)) {
          customDocs.set(doc, (customDocs.get(doc) || 0) + 1);
        }
      });
    });

    // Project custom docs sorted by frequency
    const projectOptions = [...customDocs.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([doc]) => ({
        value: doc,
        label: doc,
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
      .map((doc) => ({
        value: doc,
        label: doc,
      }));

    // Also include any selected docs that aren't in defaults or project (e.g. from other sources)
    const knownValues = new Set([
      ...DEFAULTS,
      ...customDocs.keys(),
    ]);
    const orphanOptions = selectedDocs
      .filter((doc) => !knownValues.has(doc))
      .map((doc) => ({
        value: doc,
        label: doc,
        description: "Egendefinert",
      }));

    return [...orphanOptions, ...projectOptions, ...defaultOptions];
  }, [availableEntities, selectedDocs]);

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
    if (selectedDocs.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {field.label}
          </label>
          <InfoIcon info={field.field_info} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {selectedDocs.map((doc) => (
            <span
              key={doc}
              className="inline-flex items-center px-2.5 py-1 text-sm rounded-md bg-slate-100 text-slate-700 border border-slate-200"
            >
              {getDocCode(doc) ? (
                <>
                  <span className="font-medium">{getDocCode(doc)}</span>
                  <span className="ml-1 text-slate-500">
                    {doc.replace(getDocCode(doc), "").trim()}
                  </span>
                </>
              ) : (
                doc
              )}
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
        selectedValues={selectedDocs}
        onSelectionChange={emitChange}
        placeholder="Velg dokumenter..."
        searchPlaceholder="Søk eller legg til dokument..."
        emptyMessage="Ingen dokumenter funnet"
        allowCreate
        createLabel="Legg til"
      />

      {error && (
        <div className="text-sm text-red-600 font-normal">{error}</div>
      )}
    </div>
  );
}
