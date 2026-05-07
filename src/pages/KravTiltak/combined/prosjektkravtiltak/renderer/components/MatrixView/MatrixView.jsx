import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * MatrixView — Traceability matrix showing krav×tiltak coverage
 *
 * Rows = krav (requirements)
 * Columns = tiltak (measures)
 * Dots at intersections = connected
 * Grouped by emne
 */
const MatrixView = ({ entities, onEntitySelect }) => {
  const [expandedEmner, setExpandedEmner] = useState(new Set());
  const [selectedCell, setSelectedCell] = useState(null);

  // Build matrix data from grouped entities
  const matrixData = useMemo(() => {
    if (!entities?.length) return [];

    return entities.map(group => {
      const emne = group.group?.emne || { tittel: 'Uten emne', id: 'none' };
      const items = group.items || [];

      const kravList = items.filter(e => e.entityType?.toLowerCase().includes('krav'));
      const tiltakList = items.filter(e => e.entityType?.toLowerCase().includes('tiltak'));

      // Deduplicate tiltak (same tiltak can appear multiple times in the interleaved list)
      const uniqueTiltak = [];
      const seenIds = new Set();
      for (const t of tiltakList) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          uniqueTiltak.push(t);
        }
      }

      // Build connection map: kravId -> Set of tiltakIds
      const connections = new Map();
      for (const t of tiltakList) {
        const relatedKravIds = (t.prosjektKrav || t.krav || []).map(k => k.id || k);
        for (const kravId of relatedKravIds) {
          if (!connections.has(kravId)) connections.set(kravId, new Set());
          connections.get(kravId).add(t.id);
        }
      }

      return {
        emne,
        krav: kravList,
        tiltak: uniqueTiltak,
        connections,
      };
    }).filter(g => g.krav.length > 0 || g.tiltak.length > 0);
  }, [entities]);

  // Auto-expand all on first render
  useMemo(() => {
    if (expandedEmner.size === 0 && matrixData.length > 0) {
      setExpandedEmner(new Set(matrixData.map(g => g.emne.id)));
    }
  }, [matrixData]);

  const toggleEmne = (emneId) => {
    setExpandedEmner(prev => {
      const next = new Set(prev);
      if (next.has(emneId)) next.delete(emneId);
      else next.add(emneId);
      return next;
    });
  };

  // Stats
  const totalKrav = matrixData.reduce((s, g) => s + g.krav.length, 0);
  const totalTiltak = matrixData.reduce((s, g) => s + g.tiltak.length, 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Sporingsmatrise</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalKrav} krav × {totalTiltak} unike tiltak — {matrixData.length} emner
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" /> Koblet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200" /> Ikke koblet
            </span>
          </div>
        </div>
      </div>

      {/* Matrix content */}
      <div className="flex-1 overflow-auto">
        {matrixData.map(({ emne, krav, tiltak, connections }) => {
          const isExpanded = expandedEmner.has(emne.id);
          const connectedPairs = Array.from(connections.values()).reduce((s, set) => s + set.size, 0);
          const totalPossible = krav.length * tiltak.length;
          const coverage = totalPossible > 0 ? Math.round((connectedPairs / totalPossible) * 100) : 0;

          return (
            <div key={emne.id} className="border-b border-slate-100">
              {/* Emne header */}
              <button
                onClick={() => toggleEmne(emne.id)}
                className="w-full flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: emne.color || '#6b7280' }}
                />
                <span className="text-sm font-medium text-slate-800">{emne.tittel}</span>
                <span className="text-xs text-slate-400">
                  {krav.length}K × {tiltak.length}T
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  {coverage}% dekning
                </span>
              </button>

              {/* Matrix table */}
              {isExpanded && krav.length > 0 && tiltak.length > 0 && (
                <div className="px-6 pb-4 overflow-x-auto">
                  <table className="border-collapse text-xs w-auto">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 bg-white border border-slate-200 p-0 min-w-[200px]">
                          <div className="px-2 py-1.5 text-left text-slate-500 font-medium">
                            Krav ↓ / Tiltak →
                          </div>
                        </th>
                        {tiltak.map(t => (
                          <th
                            key={t.id}
                            className="border border-slate-200 p-0 min-w-[36px] max-w-[36px]"
                          >
                            <div
                              className="writing-mode-vertical px-1 py-2 text-slate-600 font-normal cursor-pointer hover:bg-blue-50 transition-colors truncate"
                              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: '120px' }}
                              title={t.tittel}
                              onClick={() => onEntitySelect?.(t)}
                            >
                              {t.tiltakUID || `T${t.id}`}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {krav.map(k => {
                        const kravConnections = connections.get(k.id) || new Set();
                        const connectedCount = kravConnections.size;
                        return (
                          <tr key={k.id} className="hover:bg-slate-50/50">
                            <td className="sticky left-0 z-10 bg-white border border-slate-200 p-0">
                              <div
                                className="px-2 py-1.5 truncate max-w-[250px] cursor-pointer hover:text-blue-600 transition-colors"
                                title={k.tittel}
                                onClick={() => onEntitySelect?.(k)}
                              >
                                <span className="text-slate-400 mr-1">{k.kravUID || `K${k.id}`}</span>
                                <span className="text-slate-700">{k.tittel}</span>
                                {connectedCount === 0 && (
                                  <span className="ml-1 text-red-400 text-[10px]">⚠</span>
                                )}
                              </div>
                            </td>
                            {tiltak.map(t => {
                              const isConnected = kravConnections.has(t.id);
                              const cellKey = `${k.id}-${t.id}`;
                              const isSelected = selectedCell === cellKey;
                              return (
                                <td
                                  key={t.id}
                                  className={`border border-slate-200 p-0 text-center cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-100' : isConnected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
                                  }`}
                                  onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                                  title={`${k.tittel} ↔ ${t.tittel}`}
                                >
                                  {isConnected ? (
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto" />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full bg-slate-100 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty state */}
              {isExpanded && (krav.length === 0 || tiltak.length === 0) && (
                <div className="px-6 pb-4 text-xs text-slate-400">
                  {krav.length === 0 ? 'Ingen krav' : 'Ingen tiltak'} i dette emnet
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatrixView;
