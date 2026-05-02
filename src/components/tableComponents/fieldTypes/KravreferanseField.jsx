import React, { useMemo, useState, useRef, useEffect } from "react";
import { InfoIcon } from "@/components/ui/InfoIcon.jsx";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";

/**
 * KravreferanseField — single-select with project-scoped suggestion list + create new.
 *
 * Collects all kravreferanse values used across the current project's krav entities
 * and presents them as a searchable dropdown. Users can also type a new value.
 */
export default function KravreferanseField({
  field,
  value,
  onChange,
  error,
  isEditing,
  availableEntities = [],
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Build deduplicated options from all krav entities in the project, sorted by frequency
  const options = useMemo(() => {
    const counts = new Map();

    availableEntities.forEach((entity) => {
      const ref = entity.kravreferanse;
      if (ref && typeof ref === "string" && ref.trim()) {
        const trimmed = ref.trim();
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
      }
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [availableEntities]);

  // Filtered by search
  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // Can create: search text doesn't exactly match any existing option
  const canCreate =
    search.trim() &&
    !options.some((o) => o.label.toLowerCase() === search.trim().toLowerCase());

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (val) => {
    onChange({
      target: { name: field.name, value: val, type: "text" },
    });
    setOpen(false);
    setSearch("");
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange({
      target: { name: field.name, value: "", type: "text" },
    });
  };

  // --- View mode ---
  if (!isEditing) {
    if (!value) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {field.label}
          </label>
          <InfoIcon info={field.field_info} />
        </div>
        <span className="inline-flex items-center px-2.5 py-1 text-sm rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          {value}
        </span>
      </div>
    );
  }

  // --- Edit mode ---
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <InfoIcon info={field.field_info} />
      </div>

      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => {
            setOpen((p) => !p);
            if (!open) setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={`w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors
            ${open ? "border-blue-400 ring-1 ring-blue-200" : "border-slate-300 hover:border-slate-400"}
            ${error ? "border-red-400" : ""}
            bg-white`}
        >
          <span className={value ? "text-slate-900" : "text-slate-400"}>
            {value || field.placeholder || "Velg eller skriv referanse..."}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                onClick={clear}
              />
            )}
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b border-slate-100">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (canCreate) {
                      select(search.trim());
                    } else if (filtered.length === 1) {
                      select(filtered[0].label);
                    }
                  }
                  if (e.key === "Escape") {
                    setOpen(false);
                    setSearch("");
                  }
                }}
                placeholder="Søk eller skriv ny referanse..."
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto py-1">
              {/* Create option */}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => select(search.trim())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-blue-50 text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Legg til &ldquo;{search.trim()}&rdquo;
                </button>
              )}

              {/* Existing options */}
              {filtered.map((opt) => {
                const isSelected = value === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => select(opt.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors
                      ${isSelected ? "bg-slate-50 font-medium" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={`w-3.5 h-3.5 ${isSelected ? "text-blue-600" : "text-transparent"}`}
                      />
                      <span>{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {opt.count} {opt.count === 1 ? "krav" : "krav"}
                    </span>
                  </button>
                );
              })}

              {filtered.length === 0 && !canCreate && (
                <div className="px-3 py-2 text-sm text-slate-400">
                  Ingen referanser funnet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 font-normal">{error}</div>
      )}
    </div>
  );
}
