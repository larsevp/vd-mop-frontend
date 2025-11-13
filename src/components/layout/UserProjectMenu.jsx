import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Building2, Check, Plus, LogOut, Home, Layers, Tag, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore, useProjectStore } from "@/stores/userStore";
import { LogoutButton } from "@/components/ui";
import LastVisitedProjectsList from "@/components/ui/projects/LastVisitedProjectsList";
import { useLastVisitedProjects } from "@/hooks/useLastVisitedProjects";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFagomraderSimple, setActiveFagomrade } from "@/api/endpoints";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ComboBox } from "@/components/ui/form/ComboBox";

/**
 * Modern User & Project Menu - Combines user info, project context, and project switching
 * in a single elegant dropdown menu to save header space while improving UX
 */
export const UserProjectMenu = () => {
  const { user, refreshUser } = useUserStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { trackProjectVisit } = useLastVisitedProjects();
  const queryClient = useQueryClient();

  // Fetch available fagomrader
  const { data: fagomrader = [] } = useQuery({
    queryKey: ["fagomrader"],
    queryFn: getFagomraderSimple,
    select: (response) => {
      const data = Array.isArray(response) ? response : response.data || [];
      return data.sort((a, b) => {
        if (a.sortIt !== undefined && b.sortIt !== undefined) {
          return a.sortIt - b.sortIt;
        }
        return (a.tittel || "").localeCompare(b.tittel || "");
      });
    },
  });

  // Mutation for setting active fagområde
  const fagomradeMutation = useMutation({
    mutationFn: setActiveFagomrade,
    onMutate: async (newFagomradeId) => {
      // Optimistically update the UI immediately so user sees the selection change
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        useUserStore.getState().setUser({
          ...currentUser,
          fagomradeId: newFagomradeId,
        });
      }
    },
    onSuccess: async (data, variables) => {
      // Update backend succeeded - now do a full page refresh
      // This is the cleanest approach because:
      // 1. All components remount fresh with new fagområde context
      // 2. All state (React Query, Zustand, local) is completely reset
      // 3. No risk of stale data or missed cache invalidations
      // 4. User gets clear visual feedback that context changed

      // Force a full page reload to refresh all data with new fagområde filters
      window.location.reload();
    },
  });

  // Handle clicks outside menu to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProjectSwitch = (project) => {
    // Update current project
    setCurrentProject(project);
    
    // Track the visit (optimistic update + backend sync)
    trackProjectVisit(project);
    
    setIsOpen(false);
    
    // Navigate to project landing page
    navigate(`/prosjekt/${project.id}`);
  };

  const handleClearProject = () => {
    setCurrentProject(null);
    setIsOpen(false);
    navigate("/");
  };

  const handleFagomradeSelect = (event) => {
    const selectedId = event.target.value;
    const parsedId = selectedId ? parseInt(selectedId, 10) : null;
    fagomradeMutation.mutate(parsedId);
  };

  // Find current fagområde
  const currentFagomrade = user?.fagomradeId
    ? fagomrader.find(f => f.id === user.fagomradeId)
    : null;

  // Prepare fagområde options for ComboBox
  const fagomradeOptions = React.useMemo(() => {
    return fagomrader.map((fagomrade) => ({
      id: fagomrade.id.toString(),
      label: fagomrade.tittel || `ID: ${fagomrade.id}`,
      icon: fagomrade.icon,
      color: fagomrade.color,
    }));
  }, [fagomrader]);

  // Render fagområde option with icon
  const renderFagomradeOption = React.useCallback((option, isSelected, isActive) => {
    return (
      <>
        <Check className={`mr-2 h-4 w-4 flex-shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
        <div className="flex items-center flex-1 min-w-0 gap-2">
          {option.icon && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: option.color || "#8b5cf6" }}
            >
              <DynamicIcon name={option.icon} size={12} color="white" />
            </div>
          )}
          <span className="truncate text-sm">{option.label}</span>
        </div>
      </>
    );
  }, []);


  const userName = user?.name || user?.navn;
  const userInitials = userName?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/80 hover:bg-gray-100 border border-gray-200/60 transition-all duration-200 hover:shadow-sm"
        aria-label="User and project menu"
      >
        {/* User Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-xs font-semibold text-white">
            {userInitials}
          </span>
        </div>

        {/* User & Project Info */}
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <span className="text-sm font-medium text-gray-900 truncate max-w-32">
            {userName}
          </span>
          {currentProject ? (
            <span className="text-xs text-gray-500 truncate max-w-32 flex items-center gap-1">
              <Building2 size={10} />
              {currentProject.navn}
            </span>
          ) : (
            <span className="text-xs text-gray-400">Ingen prosjekt</span>
          )}
        </div>

        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-[60] overflow-hidden">
          {/* User Section */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-semibold text-white">
                  {userInitials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.rolle === "ADMIN" ? "Administrator" : "Bruker"}
                </p>
              </div>
            </div>
          </div>

          {/* Fagområde Section */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktivt fagområde
              </span>
            </div>

            <ComboBox
              name="fagomradeId"
              value={user?.fagomradeId != null ? user.fagomradeId.toString() : null}
              onChange={handleFagomradeSelect}
              placeholder="Velg fagområde..."
              disabled={fagomradeMutation.isPending}
              allowEmpty={true}
              emptyLabel="Ingen fagområde"
              options={fagomradeOptions}
              renderOption={renderFagomradeOption}
            />
          </div>

          {/* Current Project Section */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktivt prosjekt
              </span>
            </div>
            
            {currentProject ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
                <Link
                  to={`/prosjekt/${currentProject.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 flex-1 min-w-0 hover:bg-green-100 p-1 -m-1 rounded transition-colors"
                >
                  <Building2 size={16} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-green-900 truncate">
                      {currentProject.navn}
                    </p>
                    {currentProject.prosjektnummer && (
                      <p className="text-xs text-green-700">
                        Nr: {currentProject.prosjektnummer}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  onClick={handleClearProject}
                  className="text-green-600 hover:text-green-800 p-1 rounded"
                  title="Fjern aktivt prosjekt"
                >
                  <Home size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-gray-500">
                <Building2 size={16} />
                <span className="text-sm">Ingen prosjekt valgt</span>
              </div>
            )}
          </div>

          {/* Project Switcher */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sist brukte prosjekter
              </span>
            </div>
            
            <LastVisitedProjectsList
              onProjectSelect={handleProjectSwitch}
              variant="menu"
              limit={3}
              showCurrentFirst={true}
            />
          </div>

          {/* Administration Links */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Administrasjon
              </span>
            </div>

            <div className="space-y-1">
              <Link
                to="/emner"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
              >
                <Tag size={16} className="text-violet-600" />
                <span className="text-sm font-medium">Emner</span>
              </Link>

              <Link
                to="/prosjekter"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
              >
                <Building size={16} className="text-green-600" />
                <span className="text-sm font-medium">Prosjekter</span>
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <LogoutButton
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-50 hover:text-gray-900 p-2 text-sm font-medium"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProjectMenu;