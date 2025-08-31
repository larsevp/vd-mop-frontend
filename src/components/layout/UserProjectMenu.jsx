import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Building2, Check, Plus, LogOut, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore, useProjectStore } from "@/stores/userStore";
import { LogoutButton } from "@/components/ui";
import LastVisitedProjectsList from "@/components/ui/projects/LastVisitedProjectsList";
import { useLastVisitedProjects } from "@/hooks/useLastVisitedProjects";

/**
 * Modern User & Project Menu - Combines user info, project context, and project switching
 * in a single elegant dropdown menu to save header space while improving UX
 */
export const UserProjectMenu = () => {
  const { user } = useUserStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { trackProjectVisit } = useLastVisitedProjects();

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
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
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

          {/* Current Project Section */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktivt prosjekt
              </span>
            </div>
            
            {currentProject ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 flex-1 min-w-0">
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
                </div>
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