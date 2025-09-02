/*
 * Used for the recent project list in the landing page
 */
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, CardWrapper } from "@/components/ui";
import LastVisitedProjectsList from "@/components/ui/projects/LastVisitedProjectsList";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { useUserStore, useProjectStore } from "@/stores/userStore";
import { getProsjektById } from "@/api/endpoints";

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
    <CardWrapper>
      <Heading level={6} className="mb-4">
        Sist brukte prosjekter
      </Heading>
      <div className="p-2">
        <LastVisitedProjectsList
          onProjectSelect={handleProjectSelect}
          variant="landing"
          limit={5}
          showCurrentFirst={false}
          projects={recentProjects}
          isLoading={isLoading}
          hasProjects={recentProjects.length > 0}
        />
      </div>
    </CardWrapper>
  );
};

export { RecentProjectList };
