import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Reusable collapsible section component for Krav details
 */
const InfoSection = ({ title, icon: Icon, children, collapsible = false, section = null, isExpanded = true, onToggle }) => {
  const shouldExpand = collapsible ? isExpanded : true;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div
        className={`px-6 py-4 border-b border-neutral-100 flex items-center justify-between ${
          collapsible ? "cursor-pointer hover:bg-neutral-50" : ""
        }`}
        onClick={collapsible ? () => onToggle?.(section) : undefined}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-neutral-900">{title}</h3>
        </div>
        {collapsible &&
          (shouldExpand ? <ChevronDown className="h-4 w-4 text-neutral-500" /> : <ChevronRight className="h-4 w-4 text-neutral-500" />)}
      </div>
      {shouldExpand && <div className="px-6 py-4">{children}</div>}
    </div>
  );
};

export default InfoSection;
