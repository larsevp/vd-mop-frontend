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
  const [editingTiltakId, setEditingTiltakId] = useState(null); // Track single newly-created tiltak in edit mode

  const { blocks, orphanTiltak, emneList } = useMemo(
    () => buildKravBlocks(entities),
    [entities]
  );

  // Flatten all entities for field components that need project-wide data (e.g. KravreferanseField)
  const allEntities = useMemo(() => {
    if (!entities || entities.length === 0) return [];
    const first = entities[0];
    const isGrouped = first?.items || first?.group;
    if (isGrouped) {
      return entities.flatMap(group => group.items || []);
    }
    return entities;
  }, [entities]);

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
    setEditingTiltakId(null);
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
        editing={editing || !!editingTiltakId}
        onToggleEdit={() => {
          if (editingTiltakId) {
            setEditingTiltakId(null);
          } else {
            setEditing(prev => !prev);
          }
        }}
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
                  availableEntities={allEntities}
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
                        onFieldSave={(fieldName, value, entity) => {
                          onFieldSave(fieldName, value, entity);
                          // Clear single-edit state after first save from the new tiltak
                          if (editingTiltakId === tiltak.id) {
                            // Keep it editable until user navigates away
                          }
                        }}
                        editing={editing || editingTiltakId === tiltak.id}
                      />
                    ))}

                    {onCreateTiltak && (
                      <NewTiltakButton
                        currentKravId={currentBlock.krav.id}
                        onCreateTiltak={async (kravId) => {
                          const newId = await onCreateTiltak(kravId);
                          if (newId) setEditingTiltakId(newId);
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
