import React from 'react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

const EmneStrip = ({ blocks, emneList, currentIndex, onJumpTo }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
      <div className="py-2">
        {emneList.map(({ emne, count, firstBlockIndex }) => {
          // Collect krav blocks for this emne
          const emneBlocks = blocks.filter(b => b.emne?.id === emne?.id);

          return (
            <div key={emne?.id || 'no-emne'} className="mb-1">
              {/* Emne header */}
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: emne?.color || '#6b7280' }}
                >
                  {emne?.icon ? (
                    <DynamicIcon name={emne.icon} size={9} className="text-white" />
                  ) : (
                    <span className="text-white text-[7px] font-bold">
                      {(emne?.tittel || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                  {emne?.tittel || 'Uten emne'}
                </span>
                <span className="ml-auto text-[10px] text-slate-300">{count}</span>
              </div>

              {/* Krav titles under this emne */}
              {emneBlocks.map((block) => {
                const isActive = block.globalIndex === currentIndex;
                const title = block.krav.tittel || block.krav.kravUID || `Krav ${block.krav.id}`;
                const tiltakCount = block.tiltak.length;

                return (
                  <button
                    key={block.globalIndex}
                    onClick={() => onJumpTo(block.globalIndex)}
                    className={`w-full text-left px-3 py-1.5 pl-9 text-sm transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <div className="truncate">{title}</div>
                    {tiltakCount > 0 && (
                      <div className="text-[10px] text-slate-400">
                        {tiltakCount} tiltak
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmneStrip;
