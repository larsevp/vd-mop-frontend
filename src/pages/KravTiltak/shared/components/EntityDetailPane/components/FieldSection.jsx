import React from "react";
import { ChevronDown } from "lucide-react";

const FieldSection = ({ title, isExpanded, onToggle, children, noTitle = false, isMainSection = false, isEditing = false }) => {
  if (noTitle) {
    return <div className="space-y-6 pl-7">{children}</div>;
  }

  return (
    <div className={`space-y-6 ${isMainSection ? 'pb-8 border-b border-slate-100' : ''}`}>
      {/* Collapsible section - clean, no background */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center text-left hover:bg-slate-50/60 transition-all duration-200 py-3 px-0 rounded-xl gap-3 group"
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

      {/* Content area - no background, pure minimalism */}
      {isExpanded && (
        <div className="pt-4 pl-7 space-y-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default FieldSection;