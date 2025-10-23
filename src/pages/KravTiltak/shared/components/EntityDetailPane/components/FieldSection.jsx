import React from "react";
import { ChevronDown } from "lucide-react";

const FieldSection = ({ title, isExpanded, onToggle, children, noTitle = false, isMainSection = false, isEditing = false }) => {
  if (noTitle) {
    return <div className="space-y-6">{children}</div>;
  }

  return (
    <div className={`space-y-6 ${isMainSection ? 'pb-8 border-b border-slate-100' : ''}`}>
      {/* Collapsible button with chevron in both edit and view mode */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center text-left hover:bg-slate-50/60 transition-all duration-200 py-3 px-3 -mx-3 rounded-xl gap-3 group"
      >
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
        <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex-1 h-px bg-slate-200 ml-4" />
      </button>
      {/* Show content based on isExpanded state (controlled by parent logic) */}
      {isExpanded && <div className="space-y-6 pt-2">{children}</div>}
    </div>
  );
};

export default FieldSection;