import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

/**
 * MentionList - Dropdown component for entity mention suggestions
 *
 * Displays a list of entities that match the search query.
 * Supports keyboard navigation (ArrowUp, ArrowDown, Enter).
 * Called by EntityMentionExtension's suggestion render function.
 */
const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = index => {
    const item = props.items[index];
    if (item) {
      // Get UID from different possible fields
      const uid = item.uid || item.kravUID || item.tiltakUID || `ID-${item.id}`;
      const title = item.tittel || 'Untitled';

      props.command({
        id: item.id,
        label: `${uid}: ${title}`,
        uid: uid,
        entityType: item.entityType,
      });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  // Get entity type color
  const getEntityTypeColor = (entityType) => {
    const type = entityType?.toLowerCase() || '';
    if (type.includes('krav')) return 'text-red-600 bg-red-50';
    if (type.includes('tiltak')) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="mention-list bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-w-md">
      {props.items.length > 0 ? (
        <div className="max-h-60 overflow-y-auto">
          {props.items.map((item, index) => {
            const uid = item.uid || item.kravUID || item.tiltakUID || `ID-${item.id}`;
            const title = item.tittel || 'Untitled';
            const isSelected = index === selectedIndex;

            return (
              <button
                key={item.id}
                type="button"
                className={`
                  mention-item w-full text-left px-3 py-2 flex flex-col gap-1 transition-colors
                  ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'}
                `}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-2">
                  <span className={`
                    mention-uid text-xs font-mono font-semibold px-2 py-0.5 rounded flex-shrink-0
                    ${getEntityTypeColor(item.entityType)}
                  `}>
                    {uid}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="mention-title text-sm text-gray-900 flex-1 truncate font-medium">
                    {title}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-mono pl-1">
                  {uid}: {title}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-3 py-4 text-sm text-gray-500 text-center">
          Ingen entiteter funnet
        </div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
