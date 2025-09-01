import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, FolderOpen, Plus, Book, Users, CheckSquare, Briefcase, Download, ArrowLeft, Calendar, Building2 } from "lucide-react";
import { getProsjekter, setLastVisitedProject, getProsjektById } from "@/api/endpoints";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserStore, useProjectStore } from "@/stores/userStore";
import { SimpleCard } from "@/components/ui";

export default function ProjectLanding() {
  const { user } = useUserStore();
  const { setCurrentProject, currentProject } = useProjectStore();
  const navigate = useNavigate();
  const { prosjektId } = useParams();
  const isAdmin = user?.rolle === "ADMIN";

  // If prosjektId is present, this is an individual project view
  const isIndividualProjectView = !!prosjektId;

  // Fetch projects list (for project list view)
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects_list"],
    queryFn: getProsjekter,
    select: (res) => res.data,
    refetchOnWindowFocus: true,
    enabled: !isIndividualProjectView, // Only fetch for list view
  });

  // Fetch individual project (for individual project view)
  const {
    data: projectData,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["prosjekt", prosjektId],
    queryFn: () => getProsjektById(prosjektId),
    enabled: !!prosjektId,
    onSuccess: (data) => {
      // Set current project in global store when fetched
      const fullProject = data.data || data;
      setCurrentProject(fullProject);
    },
  });

  // Mutation for updating last visited project
  const updateLastVisitedMutation = useMutation({
    mutationFn: setLastVisitedProject,
    onError: (error) => {
      console.error("Failed to update last visited project:", error);
      // Continue navigation even if this fails
    },
  });

  const projects = data || [];

  // Handle individual project view
  if (isIndividualProjectView) {
    const project = projectData?.data || projectData || currentProject;

    if (projectLoading) {
      return (
        <div className="bg-background-primary min-h-screen">
          <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-text-secondary">Laster prosjekt...</p>
            </div>
          </div>
        </div>
      );
    }

    if (projectError || !project) {
      return (
        <div className="bg-background-primary min-h-screen">
          <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-red-800 mb-2">Feil ved lasting</h3>
                <p className="text-red-600">Kunne ikke laste prosjektdetaljer.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Project-specific cards for individual project view
    const projectCards = [
      {
        title: "Prosjekt Krav Workspace",
        desc: "Modern håndtering av prosjektspesifikke krav med kortvisning, avanserte søkefilter og sømløs filhåndtering",
        link: `/prosjekt-krav-workspace`,
        icon: Briefcase,
        color: "from-red-500 to-red-600",
        available: true, // Now implemented
      },
      {
        title: "Prosjekt Tiltak Workspace",
        desc: "Modern håndtering av prosjektspesifikke tiltak med kortvisning, avanserte søkefilter og sømløs filhåndtering",
        link: `/prosjekt-tiltak-workspace`,
        icon: Briefcase,
        color: "from-green-500 to-green-600",
        available: true, // Now implemented
      },
      {
        title: "Prosjekt Krav & Tiltak Combined",
        desc: "Unified view av prosjektspesifikke krav og tiltak med hierarkiske forhold og kryssreferanser",
        link: `/prosjekt-combined-workspace`,
        icon: Briefcase,
        color: "from-violet-500 to-purple-600",
        available: true, // Now implemented
      },
    ];

    const handleImportObligatoryRequirements = () => {
      // Mockup function - not yet implemented
      alert("Importer obligatoriske krav - ikke implementert ennå");
    };

    // Individual Project View
    return (
      <div className="bg-background-primary min-h-screen">
        {/* Hero section */}
        <section className="bg-primary-900 text-white">
          <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-4">
                  <Link to="/" className="inline-flex items-center text-primary-200 hover:text-white transition-colors mr-4">
                    <ArrowLeft size={20} className="mr-2" />
                    Tilbake til prosjekter
                  </Link>
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{project.navn || "Uten navn"}</h1>
                <p className="text-primary-100 mt-2">Prosjektnummer: {project.prosjektnummer || "N/A"}</p>
                {project.beskrivelse && (
                  <p className="text-primary-200 mt-2 max-w-2xl">{project.beskrivelseSnippet || project.beskrivelse}</p>
                )}
              </div>
              <div className="hidden md:flex items-center space-x-4 text-primary-200">
                {project.enhet && (
                  <div className="flex items-center">
                    <Building2 size={16} className="mr-2" />
                    <span>{project.enhet.navn}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString("nb-NO") : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          {/* Import section */}
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                <Download size={20} className="mr-2" />
                Importer obligatoriske krav
              </h2>
              <p className="text-blue-700 mb-4">
                Importer alle obligatoriske generelle krav og tiltak til dette prosjektet. Dette vil kopiere relevante krav som må følges
                opp i prosjektet.
              </p>
              <button
                onClick={handleImportObligatoryRequirements}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                <Download size={16} className="inline mr-2" />
                Importer obligatoriske krav
              </button>
            </div>
          </div>

          {/* Project modules */}
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Prosjektmoduler</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projectCards.map((card) => {
                const IconComponent = card.icon;
                const isAvailable = card.available;

                if (isAvailable) {
                  return (
                    <Link key={card.title} to={card.link} className="group block transform transition-all duration-200 hover:scale-105">
                      <div className="card-base card-hover rounded-xl p-6 h-full transition-all duration-200 group-hover:shadow-xl">
                        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${card.color} text-white mb-4 shadow-md`}>
                          <IconComponent size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary-700 transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed">{card.desc}</p>
                        <div className="flex items-center mt-4 text-primary-600 font-medium text-sm">
                          <span>Åpne modul</span>
                          <svg
                            className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                } else {
                  // Not available - show as disabled mockup
                  return (
                    <div key={card.title} className="block cursor-not-allowed opacity-60">
                      <div className="card-base rounded-xl p-6 h-full bg-gray-50 border-dashed border-2 border-gray-300">
                        <div className="inline-flex p-3 rounded-xl bg-gray-400 text-white mb-4">
                          <IconComponent size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-600 mb-2">{card.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4">{card.desc}</p>
                        <div className="flex items-center text-gray-400 font-medium text-sm">
                          <span>Kommer snart...</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  const handleProjectOpen = async (project) => {
    try {
      // Fetch full project details and store in global state
      const projectDetails = await getProsjektById(project.id);
      const fullProject = projectDetails.data || projectDetails;

      // Set current project in global store
      setCurrentProject(fullProject);

      // TODO: Fix lastVisitedProjects API call format - currently getting 400 error
      // Try to update last visited project (non-blocking)
      try {
        await updateLastVisitedMutation.mutateAsync({
          userId: user?.id,
          projectId: project.id, // Try 'projectId' instead of 'prosjektId'
          visitedAt: new Date().toISOString(),
        });
      } catch (lastVisitedError) {
        console.warn("Failed to update last visited project (non-critical):", lastVisitedError);
      }

      // Navigate to project landing page with current project context
      navigate(`/prosjekt/${project.id}`);
    } catch (error) {
      // Continue navigation even if some operations fail
      console.error("Failed to open project:", error);

      // At minimum, set the basic project info we have
      setCurrentProject(project);
      navigate(`/prosjekt/${project.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background-primary min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-text-secondary">Laster prosjekter...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-primary min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-red-800 mb-2">Feil ved lasting</h3>
              <p className="text-red-600">Feil ved lasting av prosjekter: {error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-primary min-h-screen">
      {/* Hero section */}
      <section className="bg-primary-900 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">MOP</h1>
            <p className="max-w-2xl mx-auto mt-6 text-xl">Miljø og Prosjekthåndteringssystem for oversikt over tiltak og prosjekter</p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick access card */}
          <div className="bg-primary-50 rounded-xl border border-primary-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Hurtigtilgang</h2>
            <ul className="space-y-3">
              <li>
                <Link to="/tiltak" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
                  <Book size={18} />
                  <span>Generelle tiltak</span>
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
                    <Users size={18} />
                    <span>Brukeradministrasjon</span>
                  </Link>
                </li>
              )}
              <li>
                <Link to="/prosjekter" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
                  <FolderOpen size={18} />
                  <span>Prosjektadministrasjon</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* New project card */}
          <div className="bg-background-primary rounded-xl border border-border-muted p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
              <Plus size={28} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Opprett nytt prosjekt</h2>
            <p className="text-text-muted mb-6">Start et nytt prosjekt med predefinerte tiltak</p>
            <button className="btn btn-primary rounded-lg px-5 py-2.5 font-medium shadow-sm transition-all">Nytt prosjekt</button>
          </div>

          {/* Recent projects */}
          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Sist brukte prosjekter</h2>
            <div className="space-y-4">
              {projects.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900">{project.navn}</h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        {project.beskrivelseSnippet || project.beskrivelse || "Ingen beskrivelse"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleProjectOpen(project)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors ml-4"
                      disabled={updateLastVisitedMutation.isLoading}
                    >
                      <span>Åpne</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-neutral-400">
                    Prosjektnummer: {project.prosjektnummer || "N/A"} • Sist oppdatert:{" "}
                    {new Date(project.updatedAt).toLocaleDateString("nb-NO")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects list section */}
      <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8 border-t border-neutral-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-neutral-900">Alle prosjekter</h2>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1 bg-white text-neutral-700 rounded-lg px-4 py-2 text-sm font-medium border border-neutral-300 hover:bg-neutral-50">
              <FolderOpen size={16} />
              <span>Arkiverte</span>
            </button>
            <button className="inline-flex items-center gap-1 bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors">
              <Plus size={16} />
              <span>Nytt prosjekt</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-900 sm:pl-6">
                  Prosjektnavn
                </th>
                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 lg:table-cell">
                  Beskrivelse
                </th>
                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-neutral-900 sm:table-cell">
                  Prosjektnummer
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-900">
                  Sist oppdatert
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Åpne</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-neutral-900 sm:pl-6">{project.navn}</td>
                  <td className="hidden px-3 py-4 text-sm text-neutral-500 lg:table-cell">
                    <div className="max-w-xs truncate">{project.beskrivelseSnippet || project.beskrivelse || "Ingen beskrivelse"}</div>
                  </td>
                  <td className="hidden px-3 py-4 text-sm text-neutral-500 sm:table-cell">{project.prosjektnummer || "N/A"}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-500">
                    {new Date(project.updatedAt).toLocaleDateString("nb-NO")}
                  </td>
                  <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => handleProjectOpen(project)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      disabled={updateLastVisitedMutation.isLoading}
                    >
                      Åpne<span className="sr-only">, {project.navn}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
