/*
* Used for the recent project list in the landing page
*/
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, CardWrapper } from "@/components/ui";
import LastVisitedProjectsList from "@/components/ui/projects/LastVisitedProjectsList";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { useUserStore } from "@/stores/userStore";

interface RecentProjectListProps {
  // No longer need items prop as we get data from the hook
}

const RecentProjectList = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { recentProjects, fetchRecentProjects, trackProjectVisit, isLoading } = useRecentProjectsStore();

  // Fetch recent projects when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchRecentProjects(user.id);
    }
  }, [user?.id, fetchRecentProjects]);

  const handleProjectSelect = (project: any) => {
    // Track the visit with store (includes deduplication)
    console.log('🔗 RecentProjectList: Tracking project visit:', project.id, project.navn);
    trackProjectVisit(project, user?.id);
    
    // Navigate to project
    navigate(`/prosjekt/${project.id}`);
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
        />
      </div>
    </CardWrapper>
  );
};

export { RecentProjectList };
