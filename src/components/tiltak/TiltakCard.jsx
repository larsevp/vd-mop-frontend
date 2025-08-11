import React from 'react';
import { Check, ChevronRight, Edit, Trash2, Copy, Settings } from 'lucide-react';

function TiltakCard({
  tiltak = {},
  type,
  onCopy,
  onEdit,
  onRemove,
  onEditImpl,
  vurdering = [],
  onVurderingChange
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Card content */}
        <div className="w-full md:w-2/3 p-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg text-neutral-900">{tiltak.tittel}</h3>
            {type === 'prosjekt' && 
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                Prosjekt
              </span>
            }
          </div>
          
          <p className="text-neutral-600 text-base mb-4 line-clamp-2">{tiltak.beskrivelse}</p>
          
          {type === 'prosjekt' && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="font-medium text-neutral-500 min-w-[120px]">Implementasjon:</div> 
                <div className="text-neutral-700">{tiltak.implementasjon || <span className="italic text-neutral-400">(Ikke satt)</span>}</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="font-medium text-neutral-500 min-w-[120px]">Avklaringer:</div> 
                <div className="text-neutral-700">{tiltak.avklaringer || <span className="italic text-neutral-400">(Ingen)</span>}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Buttons section */}
          <div className="bg-neutral-50 border-t md:border-t-0 md:border-l border-neutral-200">
            <div className="p-4 flex flex-row md:flex-col justify-end gap-2">
              {type === 'generell' ? (
                <>
                  <button className="inline-flex items-center gap-1.5 bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-600 transition" onClick={onCopy}>
                    <Copy size={16} />
                    <span>Kopier</span>
                  </button>
                  <button className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 rounded-lg px-4 py-2 text-sm font-medium border border-neutral-300 hover:bg-neutral-200 transition" onClick={onEdit}>
                    <Edit size={16} />
                    <span>Endre</span>
                  </button>
                </>
              ) : (
                <>
                  <button className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm font-medium border border-red-200 hover:bg-red-100 transition" onClick={onRemove}>
                    <Trash2 size={16} />
                    <span className="md:hidden lg:inline">Fjern</span>
                  </button>
                  <button className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 rounded-lg px-4 py-2 text-sm font-medium border border-neutral-300 hover:bg-neutral-200 transition" onClick={onEdit}>
                    <Edit size={16} />
                    <span className="md:hidden lg:inline">Endre</span>
                  </button>
                  <button className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-lg px-4 py-2 text-sm font-medium border border-blue-200 hover:bg-blue-100 transition" onClick={onEditImpl}>
                    <Settings size={16} />
                    <span className="md:hidden lg:inline">Implementasjon</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Vurdering panel */}
          {type === 'prosjekt' && (
            <div className="p-4 bg-white border-t md:border-t-0 md:border-l border-neutral-200 min-w-[140px]">
              <div className="font-medium text-neutral-700 mb-3 text-sm">Vurdering</div>
              <div className="space-y-2.5">
                {['Bra', 'Trenger mer arbeid', 'Utgår'].map(val => (
                  <label key={val} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${vurdering?.includes(val) ? 'bg-blue-500' : 'bg-white border border-neutral-300 group-hover:border-blue-400'}`}>
                      {vurdering?.includes(val) && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-neutral-700">{val}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TiltakCard;
