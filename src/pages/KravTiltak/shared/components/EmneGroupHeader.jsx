import React from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { generateTypeCountBadges } from '../utils/entityTypeBadges';

/**
 * EmneGroupHeader - Shared component for emne group headers
 *
 * Used across all KravTiltak entity types (krav, tiltak, prosjektkrav, prosjekttiltak)
 * Provides consistent emne grouping UI with collapse/expand functionality
 */
const EmneGroupHeader = ({
  groupData,
  isCollapsed = false,
  onToggle = () => {},
  itemCount = 0,
  entityType,
  subtitle,
  viewMode = 'split' // 'cards' or 'split'
}) => {
  const emne = groupData?.group?.emne || groupData?.emne;

  // For combined views, extract type counts
  const typeCounts = groupData?._typeCounts;
  const isCombinedView = entityType?.includes('combined');
  const isCardsMode = viewMode === 'cards';

  return (
    <div
      className={`sticky top-0 bg-white cursor-pointer transition-colors z-10 ${
        isCardsMode
          ? 'py-5'
          : 'px-4 py-3 border-b border-gray-100 hover:bg-gray-50'
      }`}
      onClick={onToggle}
    >
      {isCardsMode ? (
        /* 📰 ARTICLE MODE - Centered with decorative lines */
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center gap-4">
            {/* Left line */}
            <div className="flex-1 h-px bg-slate-200" />

            {/* Center content */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Collapse/Expand Icon */}
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}

              {/* Emne Icon with Color */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: emne?.color || "#6b7280" }}
              >
                <div className="text-white">
                  {emne?.icon ? (
                    <DynamicIcon name={emne.icon} size={16} color="white" />
                  ) : (
                    <FileText size={16} />
                  )}
                </div>
              </div>

              {/* Emne Title */}
              <h3 className="text-base font-light text-slate-900 uppercase tracking-wider">
                {emne?.tittel || "Uten emne"}
              </h3>
            </div>

            {/* Right line */}
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Type counts for combined views */}
          {isCombinedView && typeCounts && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {generateTypeCountBadges(typeCounts).map((badge, index) => (
                <span key={index} className={badge.classes}>
                  {badge.count} {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 📋 SPLIT MODE - Compact list header */
        <div className="flex items-center gap-3">
          {/* Collapse/Expand Icon */}
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}

          {/* Emne Icon with Color */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: emne?.color || "#6b7280" }}
          >
            <div className="text-white">
              {emne?.icon ? (
                <DynamicIcon name={emne.icon} size={14} color="white" />
              ) : (
                <FileText size={14} />
              )}
            </div>
          </div>

          {/* Emne Title and Item Count */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {emne?.tittel || "Uten emne"}
                </h3>
                {/* Combined view: Show colored type breakdown */}
                {isCombinedView && typeCounts && (
                  <div className="flex items-center gap-2 mt-1">
                    {generateTypeCountBadges(typeCounts).map((badge, index) => (
                      <span key={index} className={badge.classes}>
                        {badge.count} {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {itemCount} oppføringer
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmneGroupHeader;