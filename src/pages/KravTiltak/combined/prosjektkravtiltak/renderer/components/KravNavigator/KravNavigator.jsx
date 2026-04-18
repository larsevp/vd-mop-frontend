import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { buildKravBlocks } from './helpers/kravBlockBuilder';
import NavigationBar from './components/NavigationBar';
import KravCard from './components/KravCard';
import TiltakSubCard from './components/TiltakSubCard';
import EmneStrip from './components/EmneStrip';
import NewTiltakButton from './components/NewTiltakButton';

const KravNavigator = ({ entities, onFieldSave, onCreateTiltak, onCreateKrav }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editing, setEditing] = useState(false);

  const { blocks, orphanTiltak, emneList } = useMemo(
    () => buildKravBlocks(entities),
    [entities]
  );

  // Total navigable items: krav blocks + orphan tiltak (shown as separate "pages")
  const totalItems = blocks.length + (orphanTiltak.length > 0 ? 1 : 0);

  // Clamp index when blocks change
  useEffect(() => {
    if (currentIndex >= totalItems && totalItems > 0) {
      setCurrentIndex(totalItems - 1);
    }
  }, [totalItems, currentIndex]);

  const isOrphanPage = currentIndex >= blocks.length;
  const currentBlock = isOrphanPage ? null : blocks[currentIndex] || null;

  const goTo = useCallback((index) => {
    if (index >= 0 && index < totalItems) {
      setCurrentIndex(index);
    }
  }, [totalItems]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  // Reset editing when navigating
  useEffect(() => {
    setEditing(false);
  }, [currentIndex]);

  // Keyboard: arrows to navigate, E to edit, Esc to exit edit
  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active?.tagName) ||
        active?.contentEditable === 'true';

      if (e.key === 'Escape') {
        if (isInputFocused) {
          active.blur();
          return;
        }
        if (editing) {
          setEditing(false);
          return;
        }
        return;
      }

      if (isInputFocused) return;

      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editing) {
        e.preventDefault();
        // Blur any focused field to trigger save, then exit edit mode
        document.activeElement?.blur();
        setEditing(false);
        return;
      }

      if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setEditing(prev => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, editing]);

  if (totalItems === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>Ingen krav å vise</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <NavigationBar
        currentBlock={currentBlock}
        currentIndex={currentIndex}
        totalCount={totalItems}
        onPrev={goPrev}
        onNext={goNext}
        isOrphanPage={isOrphanPage}
        editing={editing}
        onToggleEdit={() => setEditing(prev => !prev)}
        onCreateKrav={onCreateKrav ? async () => {
          await onCreateKrav();
          // Navigate to the last block (new krav will be appended)
          setTimeout(() => {
            setCurrentIndex(blocks.length); // will be clamped by useEffect if needed
            setEditing(true);
          }, 300);
        } : null}
      />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* EmneStrip sidebar — shows krav titles per emne */}
        <EmneStrip
          blocks={blocks}
          emneList={emneList}
          currentIndex={currentIndex}
          onJumpTo={goTo}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-4 px-6 space-y-3">
            {isOrphanPage ? (
              /* Orphan tiltak page */
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tiltak uten krav ({orphanTiltak.length})
                </h3>
                {orphanTiltak.map((tiltak) => (
                  <TiltakSubCard
                    key={tiltak.id}
                    tiltak={tiltak}
                    onFieldSave={onFieldSave}
                  />
                ))}
              </div>
            ) : currentBlock && (
              <>
                {/* Krav card */}
                <KravCard
                  krav={currentBlock.krav}
                  emne={currentBlock.emne}
                  onFieldSave={onFieldSave}
                  editing={editing}
                />

                {/* Tiltak section */}
                {(currentBlock.tiltak.length > 0 || onCreateTiltak) && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tiltak ({currentBlock.tiltak.length})
                    </h3>

                    {currentBlock.tiltak.map((tiltak) => (
                      <TiltakSubCard
                        key={tiltak.id}
                        tiltak={tiltak}
                        onFieldSave={onFieldSave}
                        editing={editing}
                      />
                    ))}

                    {onCreateTiltak && (
                      <NewTiltakButton
                        currentKravId={currentBlock.krav.id}
                        onCreateTiltak={async (kravId) => {
                          await onCreateTiltak(kravId);
                          setEditing(true);
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KravNavigator;
