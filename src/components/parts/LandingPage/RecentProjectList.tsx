/*
 * Used for the recent project list in the landing page
 */
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import LastVisitedProjectsList from "@/components/ui/projects/LastVisitedProjectsList";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { useUserStore, useProjectStore } from "@/stores/userStore";
import { getProsjektById } from "@/api/endpoints";
import ScrollableContainer from "@/components/ui/layout/scrollable-container";

interface RecentProjectListProps {
  // No longer need items prop as we get data from the hook
}

const RecentProjectList = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { setCurrentProject } = useProjectStore();
  const { recentProjects, fetchRecentProjects, trackProjectVisit, isLoading } = useRecentProjectsStore();

  // Fetch recent projects when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchRecentProjects(user.id);
    }
  }, [user?.id, fetchRecentProjects]);

  const handleProjectSelect = async (project: any) => {
    // Use the same logic as the working "Åpne" button in the table
    try {
      // Fetch full project details and store in global state
      const projectDetails = await getProsjektById(project.id);
      const fullProject = projectDetails.data || projectDetails;

      // Set current project in global store
      setCurrentProject(fullProject);

      // Track project visit using the store
      trackProjectVisit(fullProject, user?.id);

      // Navigate to project landing page with current project context
      navigate(`/prosjekt/${project.id}`);
    } catch (error) {
      // Continue navigation even if some operations fail
      console.error("Failed to open project from recent list:", error);

      // At minimum, set the basic project info we have and track the visit
      setCurrentProject(project);
      trackProjectVisit(project, user?.id);
      navigate(`/prosjekt/${project.id}`);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-sky-300 hover:shadow-md transition-all h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex p-2.5 rounded-lg bg-blue-100 text-blue-600">
          <Clock size={20} />
        </div>
        <h2 className="text-base font-medium text-gray-900">Sist brukte prosjekter</h2>
      </div>

      <ScrollableContainer maxHeight="105px" fadeColor="from-white" dependencies={[recentProjects.length]}>
        <LastVisitedProjectsList
          onProjectSelect={handleProjectSelect}
          variant="menu"
          limit={10}
          showCurrentFirst={false}
          projects={recentProjects}
          isLoading={isLoading}
          hasProjects={recentProjects.length > 0}
        />
      </ScrollableContainer>
    </div>
  );
};

export { RecentProjectList };
