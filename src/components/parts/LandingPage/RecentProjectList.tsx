/*
* Used for the recent project list in the landing page
*/
import React from "react";
import { useNavigate } from "react-router-dom";
import { Heading, CardWrapper } from "@/components/ui";
import LastVisitedProjectsList from "@/components/ui/projects/LastVisitedProjectsList";
import { useLastVisitedProjects } from "@/hooks/useLastVisitedProjects";

interface RecentProjectListProps {
  // No longer need items prop as we get data from the hook
}

const RecentProjectList = (): JSX.Element => {
  const navigate = useNavigate();
  const { trackProjectVisit } = useLastVisitedProjects();

  const handleProjectSelect = (project: any) => {
    // Track the visit
    trackProjectVisit(project);
    
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
