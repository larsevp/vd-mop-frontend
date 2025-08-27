import { Button } from "@/components/ui/primitives/button";
import { GitBranch, ArrowUp, CheckCircle, ExternalLink } from "lucide-react";
import InfoSection from "../InfoSection.jsx";

/**
 * Section displaying hierarchy and child relationships for Krav
 */
const HierarchySection = ({ krav, childKrav = [], expandedSections, onToggleSection, onNavigateToKrav }) => {
  // Only show this section if there are children or a parent
  if (!childKrav.length && !krav.parentId) {
    return null;
  }

  return (
    <InfoSection
      title={krav.parentId ? "Krav hierarki" : "Underkrav"}
      icon={GitBranch}
      collapsible={true}
      section="underkrav"
      isExpanded={expandedSections.underkrav}
      onToggle={onToggleSection}
    >
      <div className="space-y-4">
        {/* Parent Information */}
        {krav.parentId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-2">
              <ArrowUp size={16} />
              Dette er et underkrav
            </div>
            <p className="text-blue-700 text-sm">
              Tilhører overordnet krav:
              <button
                onClick={() => onNavigateToKrav?.(krav.parentId)}
                className="ml-1 hover:underline hover:text-blue-800 transition-colors"
              >
                {krav.parent?.tittel ? (
                  <span>
                    <span className="font-medium">{krav.parent.tittel}</span>
                    <span className="font-mono text-blue-600 ml-1">({krav.parent.kravUID || `#${krav.parentId}`})</span>
                  </span>
                ) : (
                  <span className="font-mono">{krav.parent?.kravUID || `#${krav.parentId}`}</span>
                )}
              </button>
            </p>
          </div>
        )}

        {/* Children Information */}
        {childKrav.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <GitBranch size={16} />
              Underkrav ({childKrav.length})
            </h4>
            <div className="space-y-2">
              {childKrav.map((child) => (
                <div key={child.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-neutral-500 bg-white px-2 py-1 rounded">
                          {child.kravUID || `#${child.id}`}
                        </span>
                        {child.obligatorisk && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">
                            <CheckCircle size={10} />
                            Obligatorisk
                          </span>
                        )}
                      </div>
                      <h5 className="font-medium text-neutral-900 text-sm leading-tight">{child.tittel || "Uten tittel"}</h5>
                      {child.beskrivelseSnippet && <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{child.beskrivelseSnippet}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigateToKrav?.(child.id)}
                      className="text-neutral-500 hover:text-blue-600"
                      title="Vis detaljer"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </InfoSection>
  );
};

export default HierarchySection;
