import React from 'react';
import { ChevronLeft, ChevronRight, Pencil, Save } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Button } from '@/components/ui/primitives/button';

const NavigationBar = ({ currentBlock, currentIndex, totalCount, onPrev, onNext, isOrphanPage, editing, onToggleEdit }) => {
  const emne = currentBlock?.emne;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalCount - 1;

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-2.5">
        {/* Left: Emne identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {isOrphanPage ? (
            <span className="text-sm font-medium text-slate-500">Tiltak uten krav</span>
          ) : (
            <>
              {emne && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: emne.color || '#6b7280' }}
                >
                  {emne.icon ? (
                    <DynamicIcon name={emne.icon} size={13} className="text-white" />
                  ) : (
                    <span className="text-white text-[9px] font-bold">
                      {(emne.tittel || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <span className="text-sm text-slate-500 truncate">
                {emne?.tittel || 'Uten emne'}
              </span>
            </>
          )}
        </div>

        {/* Center: Action buttons */}
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              onClick={() => {
                document.activeElement?.blur();
                onToggleEdit();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
              title="Lagre og avslutt (Ctrl+Enter)"
            >
              <Save className="w-3.5 h-3.5" />
              Lagre
            </button>
          ) : (
            <button
              onClick={onToggleEdit}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200"
              title="Rediger (E)"
            >
              <Pencil className="w-3.5 h-3.5" />
              Rediger
            </button>
          )}
        </div>

        {/* Right: Navigation controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrev}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-slate-400 tabular-nums min-w-[50px] text-center">
            {currentIndex + 1} / {totalCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Thin emne color accent line */}
      {!isOrphanPage && emne?.color && (
        <div className="h-0.5" style={{ backgroundColor: emne.color }} />
      )}
    </div>
  );
};

export default NavigationBar;
