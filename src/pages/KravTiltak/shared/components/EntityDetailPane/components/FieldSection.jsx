import React from "react";

const FieldSection = ({ title, isExpanded, onToggle, children, noTitle = false }) => {
  if (noTitle) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center text-left hover:bg-gray-50 transition-colors duration-200 py-3 px-2 -mx-2 rounded-md gap-3 border border-gray-200"
      >
        <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
          {isExpanded ? "−" : "+"}
        </div>
        <h3 className="text-sm font-medium text-gray-800">{title}</h3>
      </button>
      {isExpanded && <div className="space-y-4 pt-2 pl-2">{children}</div>}
    </div>
  );
};

export default FieldSection;