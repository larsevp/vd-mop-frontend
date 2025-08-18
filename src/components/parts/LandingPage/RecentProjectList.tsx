/*
* Used fo;
} from "lucide-react";
import React from "react";
/*
* Used for the recent project list in the landing page
*/
import { ArrowRight, Award, Building2, HeartHandshake, Leaf, Lightbulb, Trophy, FolderOpen } from "lucide-react";
import React from "react";
import { Separator, Heading, CardWrapper } from "@/components/ui";

interface ProjectItem {
  id: number;
  navn: string;
  link: string;
}

interface RecentProjectListProps {
  items?: ProjectItem[];
}

const RecentProjectList = ({ items = [] }: RecentProjectListProps) => {
  return (
    <CardWrapper>
      <Heading level={6} className="mb-4">
        Sist brukte prosjekter
      </Heading>
      <div className="flex flex-col">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Ingen prosjekter funnet.</p>
          </div>
        ) : (
          items.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <Separator className="my-2" />}
              <a
                href={"string" + item.id}
                className="grid items-center gap-2 px-4 py-5 md:grid-cols-[3fr_1fr] hover:bg-neutral-50 rounded-lg transition cursor-pointer"
              >
                {/* Name Column */}
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary-700" />
                  <Heading level={6} className="text-sm font-medium">
                    {item.navn.length > 30 ? `${item.navn.slice(0, 30)}...` : item.navn}
                  </Heading>
                </div>
              </a>
            </React.Fragment>
          ))
        )}
      </div>
    </CardWrapper>
  );
};

export { RecentProjectList };
