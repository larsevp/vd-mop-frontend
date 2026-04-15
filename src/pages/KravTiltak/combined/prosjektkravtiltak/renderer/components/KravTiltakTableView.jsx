import React, { useMemo, useState, useCallback } from 'react';
import { ShieldCheck, Link2Off, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { buildTableRows } from '../helpers/tableRowBuilder';
import { getIcon } from '../../../../shared/components/EntityCard/helpers/iconHelpers.jsx';
import HorizontalScrollableContainer from '@/components/ui/layout/horizontal-scrollable-container';

// ─── Utility ───────────────────────────────────────────────────────

function parseJsonArray(value) {
  if (!value) return [];
  try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch {}
  return value?.trim() ? [value.trim()] : [];
}

// ─── Display components ────────────────────────────────────────────

function PillBadges({ values }) {
  if (!values?.length) return null;
  return (
    <div className="flex flex-wrap gap-0.5">
      {values.slice(0, 2).map((v, i) => (
        <span key={i} className="inline-block px-1.5 py-px text-[11px] bg-slate-50 text-slate-600 rounded border border-slate-200/80 truncate max-w-[100px]">{v}</span>
      ))}
      {values.length > 2 && <span className="text-[11px] text-slate-400">+{values.length - 2}</span>}
    </div>
  );
}

function StatusCell({ entity }) {
  if (!entity?.status) return null;
  const { color, navn } = entity.status;
  return (
    <div className="flex items-center gap-1.5" title={navn}>
      {color && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
      <span className="text-[11px] text-slate-600 truncate">{navn}</span>
    </div>
  );
}

function Trunc({ value }) {
  if (!value) return null;
  return <span className="text-[11px] leading-tight text-slate-600 truncate block" title={value}>{value}</span>;
}

function FrequencyBadge({ value }) {
  if (!value) return null;
  return <span className="inline-block px-1.5 py-px text-[11px] rounded bg-slate-50 text-slate-600 border border-slate-200/80 whitespace-nowrap">{value}</span>;
}

// ─── Sort icon ─────────────────────────────────────────────────────

function SortIcon({ active, order }) {
  if (!active) return <ArrowUp className="w-2.5 h-2.5 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />;
  if (order === 'asc') return <ArrowUp className="w-2.5 h-2.5 text-blue-500" />;
  return <ArrowDown className="w-2.5 h-2.5 text-blue-500" />;
}

// ─── Main component ────────────────────────────────────────────────

export default function KravTiltakTableView({ entities, selectedEntity, onEntitySelect }) {
  const [collapsedEmne, setCollapsedEmne] = useState(new Set());
  const [sort, setSort] = useState({ field: null, order: null });

  const groupedData = useMemo(() => {
    if (!entities || !Array.isArray(entities) || entities.length === 0) return [];
    const first = entities[0];
    if (first?.items || first?.entities) return entities;
    return [{ items: entities, group: null }];
  }, [entities]);

  const selectedId = selectedEntity?.renderId || selectedEntity?.id;

  const toggleEmne = (emneId) => {
    setCollapsedEmne(prev => {
      const next = new Set(prev);
      next.has(emneId) ? next.delete(emneId) : next.add(emneId);
      return next;
    });
  };

  const toggleSort = (field) => {
    setSort(prev => {
      if (prev.field === field) {
        if (prev.order === 'asc') return { field, order: 'desc' };
        return { field: null, order: null };
      }
      return { field, order: 'asc' };
    });
  };

  const selectEntity = useCallback((entity, focusField) => {
    if (!entity) return;
    // Attach focusField so the detail pane can auto-edit + scroll to it
    if (focusField) {
      entity = { ...entity, __focusField: focusField };
    }
    onEntitySelect(entity);
  }, [onEntitySelect]);

  // Clickable cell — opens side panel, optionally focused on a field
  const cell = (entity, content, { rowSpan, className = '', field } = {}) => {
    if (!entity) return <td className={`px-2 py-1.5 ${className}`} rowSpan={rowSpan} />;
    return (
      <td
        className={`px-2 py-1.5 align-top cursor-pointer ${className}`}
        rowSpan={rowSpan}
        onClick={() => selectEntity(entity, field)}
      >
        {content}
      </td>
    );
  };

  // Header column with sort
  const headerCol = (key, label, width, extra = '') => {
    const active = sort.field === key;
    return (
      <th
        key={key + label}
        className={`${width} px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wide text-slate-400 cursor-pointer select-none group hover:text-slate-600 hover:bg-slate-50 transition-colors ${extra}`}
        onClick={() => toggleSort(key)}
      >
        <div className="flex items-center gap-0.5">
          <span>{label}</span>
          <SortIcon active={active} order={sort.order} />
        </div>
      </th>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <HorizontalScrollableContainer fadeColor="from-white" dependencies={[entities]} className="flex-1 min-h-0">
        <table className="w-full border-collapse text-[11px]" style={{ minWidth: '1300px' }}>
          <thead className="sticky top-0 z-20">
            {/* Section labels */}
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500" colSpan={2}>Krav</th>
              <th className="px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-l border-slate-300" colSpan={9}>Tiltak</th>
            </tr>
            {/* Column headers */}
            <tr className="bg-white border-b border-slate-300">
              {headerCol('kravTittel', 'Tittel', 'min-w-[200px]')}
              {headerCol('beskrivelse', 'Beskrivelse', 'min-w-[160px]', 'border-r border-slate-300')}
              {headerCol('tiltakTittel', 'Tittel', 'min-w-[180px]', 'border-l border-slate-300')}
              {headerCol('implementasjon', 'Implementasjon', 'min-w-[200px]')}
              {headerCol('styrendeDokumentasjon', 'Styr.dok.', 'w-24')}
              {headerCol('kontrolleresVed', 'Kontr.ved', 'w-24')}
              {headerCol('kontrollobjekt', 'Kontr.obj.', 'w-20')}
              {headerCol('kontrollHyppighet', 'Hyppighet', 'w-24')}
              {headerCol('kontrollDokumentasjon', 'Kontr.dok.', 'w-20')}
              {headerCol('kontrollKommentar', 'Kommentar', 'w-24')}
              {headerCol('statusId', 'Status', 'w-16')}
            </tr>
          </thead>

          <tbody>
            {groupedData.map((group, gi) => {
              const emne = group.emne || group.group?.emne || group.group;
              const items = group.items || group.entities || [];
              const tableRows = buildTableRows(items);
              const emneKey = emne?.id || `group-${gi}`;
              const isCollapsed = collapsedEmne.has(emneKey);
              const hasRealEmne = emne && emne.id;

              return (
                <React.Fragment key={emneKey}>
                  {emne && (
                    <tr className="cursor-pointer select-none hover:bg-slate-100/50 transition-colors" onClick={() => toggleEmne(emneKey)}>
                      <td colSpan={11} className="px-3 py-1.5 bg-slate-50 border-y border-slate-200">
                        <div className="flex items-center gap-1.5">
                          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          {hasRealEmne && emne.icon && <div className="flex-shrink-0" style={{ color: emne.color || '#94a3b8' }}>{getIcon(emne.icon, 13)}</div>}
                          {hasRealEmne && !emne.icon && emne.color && <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: emne.color }} />}
                          <span className={`font-medium text-xs ${hasRealEmne ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                            {emne.tittel || emne.navn || emne.title || 'Uten emne'}
                          </span>
                          <span className="text-[10px] text-slate-300">{tableRows.length}</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isCollapsed && tableRows.map((row, ri) => {
                    const { krav, tiltak, kravRowSpan, depth, isOrphan } = row;
                    const showKrav = kravRowSpan > 0;
                    const isKravStart = showKrav && krav;
                    const hasTiltak = !!tiltak;
                    const isSelected = (krav && (krav.renderId === selectedId || krav.id === selectedId)) ||
                                       (tiltak && (tiltak.renderId === selectedId || tiltak.id === selectedId));

                    return (
                      <tr
                        key={`${gi}-${ri}`}
                        className={[
                          'transition-colors duration-75',
                          isKravStart ? 'border-t border-slate-200' : 'border-t border-slate-100',
                          isSelected ? 'bg-slate-100' : 'hover:bg-slate-50/40',
                        ].join(' ')}
                      >
                        {/* Krav cells */}
                        {showKrav && (
                          krav ? (
                            <>
                              {cell(krav,
                                <div className="flex items-baseline gap-1.5" style={{ paddingLeft: `${depth * 12}px` }}>
                                  <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">{krav.kravUID}</span>
                                  <span className="text-[12px] font-medium text-slate-900 truncate leading-snug">{krav.tittel}</span>
                                </div>,
                                { rowSpan: kravRowSpan, field: 'tittel' }
                              )}
                              {cell(krav,
                                <Trunc value={krav.beskrivelseSnippet || krav.informasjonSnippet} />,
                                { rowSpan: kravRowSpan, className: 'border-r border-slate-300', field: 'beskrivelse' }
                              )}
                            </>
                          ) : (
                            <>
                              <td className="px-2 py-1.5" />
                              <td className="px-2 py-1.5 border-r border-slate-300" />
                            </>
                          )
                        )}

                        {/* Tiltak cells */}
                        {hasTiltak ? (
                          <>
                            {cell(tiltak,
                              <div className="flex items-baseline gap-1.5">
                                <div className="flex items-center gap-0.5 flex-shrink-0 w-[52px]">
                                  <span className="font-mono text-[10px] text-slate-400">{tiltak.tiltakUID}</span>
                                  <div className="w-3 h-3 flex-shrink-0">
                                    {(tiltak.kontrollHyppighet || tiltak.kontrolleresVed || tiltak.kontrollobjekt || tiltak.styrendeDokumentasjon)
                                      ? <ShieldCheck className="w-3 h-3 text-slate-300" />
                                      : null
                                    }
                                  </div>
                                  {isOrphan && <Link2Off className="w-3 h-3 text-amber-400" title="Ikke koblet til krav" />}
                                </div>
                                <span className="text-[12px] text-slate-800 truncate leading-snug">{tiltak.tittel}</span>
                              </div>,
                              { field: 'tittel' }
                            )}
                            {cell(tiltak, <Trunc value={tiltak.implementasjonSnippet} />, { field: 'implementasjon' })}
                            {cell(tiltak, <PillBadges values={parseJsonArray(tiltak.styrendeDokumentasjon)} />, { field: 'styrendeDokumentasjon' })}
                            {cell(tiltak, <PillBadges values={parseJsonArray(tiltak.kontrolleresVed)} />, { field: 'kontrolleresVed' })}
                            {cell(tiltak, <Trunc value={tiltak.kontrollobjekt} />, { field: 'kontrollobjekt' })}
                            {cell(tiltak, <FrequencyBadge value={tiltak.kontrollHyppighet} />, { field: 'kontrollHyppighet' })}
                            {cell(tiltak, <Trunc value={tiltak.kontrollDokumentasjon} />, { field: 'kontrollDokumentasjon' })}
                            {cell(tiltak, <Trunc value={tiltak.kontrollKommentar} />, { field: 'kontrollKommentar' })}
                            {cell(tiltak, <StatusCell entity={tiltak} />, { field: 'statusId' })}
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-1.5 align-top">
                              {isKravStart && <span className="text-slate-300 italic text-[11px]">Ingen tiltak</span>}
                            </td>
                            {Array.from({ length: 8 }).map((_, i) => <td key={i} className="px-2 py-1.5" />)}
                          </>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </HorizontalScrollableContainer>
    </div>
  );
}
