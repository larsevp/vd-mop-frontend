import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TiptapDisplay } from '@/components/ui/editor/TiptapDisplay';

const MAX_HEIGHT = 120;

const TruncatedRichText = ({ content, className = 'text-sm text-slate-700' }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      setOverflows(contentRef.current.scrollHeight > MAX_HEIGHT);
    }
  }, [content]);

  useEffect(() => {
    setExpanded(false);
  }, [content]);

  const hasContent = content && content !== '<p></p>' && content.replace(/<[^>]*>/g, '').trim();
  if (!hasContent) return <span className="text-sm text-slate-300 italic">Tomt</span>;

  const isTruncated = overflows && !expanded;

  return (
    <div>
      <div
        ref={contentRef}
        onClick={isTruncated ? () => setExpanded(true) : undefined}
        className={`overflow-hidden ${isTruncated ? 'cursor-pointer relative' : ''}`}
        style={isTruncated ? { maxHeight: `${MAX_HEIGHT}px` } : undefined}
      >
        <TiptapDisplay content={content} className={className} />
        {isTruncated && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      {isTruncated && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="mt-1 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
        >
          <ChevronDown className="w-3 h-3" />
          Vis mer
        </button>
      )}
      {overflows && expanded && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          className="mt-1 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
        >
          <ChevronUp className="w-3 h-3" />
          Skjul
        </button>
      )}
    </div>
  );
};

export default TruncatedRichText;
