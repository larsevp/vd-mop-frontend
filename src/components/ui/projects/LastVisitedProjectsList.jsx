import React from "react";
import { Building2, Check } from "lucide-react";
import { useLastVisitedProjects } from "@/hooks/useLastVisitedProjects";
import { useProjectStore } from "@/stores/userStore";

/**
 * Reusable LastVisitedProjectsList component
 * Can be styled differently based on variant prop
 * 
 * @param {Object} props
 * @param {Function} props.onProjectSelect - Callback when project is selected
 * @param {string} props.variant - "menu" | "landing" - Controls styling
 * @param {number} props.limit - Maximum number of projects to show
 * @param {boolean} props.showCurrentFirst - Put current project first in list
 * @param {string} props.className - Additional CSS classes
 * @param {Array} props.projects - Projects array (optional, uses hook if not provided)
 * @param {boolean} props.isLoading - Loading state (optional, uses hook if not provided)
 * @param {boolean} props.hasProjects - Has projects flag (optional, uses hook if not provided)
 */
const LastVisitedProjectsList = ({ 
  onProjectSelect,
  variant = "menu",
  limit = 3,
  showCurrentFirst = true,
  className = "",
  projects: providedProjects,
  isLoading: providedIsLoading,
  hasProjects: providedHasProjects
}) => {
  const hookData = useLastVisitedProjects();
  const { currentProject } = useProjectStore();

  // Use provided props or fall back to hook data
  const projects = providedProjects ?? hookData.projects;
  const isLoading = providedIsLoading ?? hookData.isLoading;
  const hasProjects = providedHasProjects ?? hookData.hasProjects;
  const isError = hookData.isError;

  // Sort and limit projects
  const displayProjects = React.useMemo(() => {
    if (!hasProjects) return [];
    
    let sortedProjects = [...projects];
    
    if (showCurrentFirst && currentProject) {
      // Put current project first, then others
      const otherProjects = sortedProjects.filter(p => p.id !== currentProject.id);
      const currentInList = sortedProjects.find(p => p.id === currentProject.id);
      
      if (currentInList) {
        sortedProjects = [currentInList, ...otherProjects];
      } else {
        sortedProjects = [currentProject, ...otherProjects];
      }
    }
    
    return sortedProjects.slice(0, limit);
  }, [projects, currentProject, showCurrentFirst, limit, hasProjects]);

  // Variant-based styling
  const getItemClasses = () => {
    const base = "w-full flex items-center justify-between text-left transition-colors group";
    
    if (variant === "menu") {
      return `${base} py-1.5 px-2 hover:bg-gray-50`;
    }
    
    if (variant === "landing") {
      return `${base} p-3 hover:bg-gray-50 rounded-lg border border-gray-100`;
    }
    
    return base;
  };

  const getIconSize = () => variant === "menu" ? 12 : 16;
  
  const getTextClasses = () => {
    if (variant === "menu") {
      return "text-xs font-medium text-gray-700 truncate group-hover:text-gray-900";
    }
    
    if (variant === "landing") {
      return "text-sm font-medium text-gray-800 truncate group-hover:text-gray-900";
    }
    
    return "text-sm font-medium text-gray-800 truncate";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={getItemClasses()}>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Building2 size={variant === "menu" ? 16 : 24} className="mx-auto mb-2 text-gray-300" />
        <p className={variant === "menu" ? "text-xs text-gray-500" : "text-sm text-gray-500"}>
          Kunne ikke laste prosjekter
        </p>
      </div>
    );
  }

  // Empty state
  if (!hasProjects || displayProjects.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <Building2 size={variant === "menu" ? 16 : 24} className="mx-auto mb-2 text-gray-300" />
        <p className={variant === "menu" ? "text-xs text-gray-500" : "text-sm text-gray-500"}>
          Ingen prosjekter tilgjengelig
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {displayProjects.map((project) => (
        <button
          key={project.id}
          onClick={() => onProjectSelect?.(project)}
          className={getItemClasses()}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 
              size={getIconSize()} 
              className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <p className={getTextClasses()}>
                {project.navn}
              </p>
              {variant === "landing" && project.prosjektnummer && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Nr: {project.prosjektnummer}
                </p>
              )}
            </div>
          </div>
          {currentProject?.id === project.id && (
            <Check 
              size={getIconSize()} 
              className="text-green-600 flex-shrink-0" 
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default LastVisitedProjectsList;