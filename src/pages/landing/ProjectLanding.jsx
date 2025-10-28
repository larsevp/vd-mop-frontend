import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowRight, FolderOpen, Plus, Book, Users, CheckSquare, Briefcase, Download, ArrowLeft, Calendar, Building2, FileText, X } from "lucide-react";
import { getProsjekter, getProsjektById } from "@/api/endpoints";
import { useQuery } from "@tanstack/react-query";
import { useUserStore, useProjectStore } from "@/stores/userStore";
import { SimpleCard } from "@/components/ui";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import { ExpandableRichText } from "@/components/tableComponents/displayValues/ExpandableRichText";
import ImportKravWizard from "@/components/ui/projects/ImportKravWizard";
import CreateProjectModal from "@/components/ui/projects/CreateProjectModal";
import { updateProsjekt } from "@/api/endpoints/models/prosjekt";

export default function ProjectLanding() {
  const { user } = useUserStore();
  const { setCurrentProject, currentProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { prosjektId } = useParams();
  const isAdmin = user?.rolle === "ADMIN";
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Use the store for consistent project visit tracking
  const { trackProjectVisit } = useRecentProjectsStore();

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

      // Track project visit when project page loads
      trackProjectVisit(fullProject, user?.id);
    },
  });

  // Also track visit on direct navigation to project page
  useEffect(() => {
    if (isIndividualProjectView && projectData) {
      const project = projectData.data || projectData;
      if (project && project.id) {
        trackProjectVisit(project, user?.id);
      }
    }
  }, [isIndividualProjectView, projectData, trackProjectVisit]);

  // Handle escape key for closing modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showFullDescription) {
        setShowFullDescription(false);
      }
    };
    
    if (showFullDescription) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showFullDescription]);

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
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        available: true, // Now implemented
      },
      {
        title: "Prosjekt Tiltak Workspace",
        desc: "Modern håndtering av prosjektspesifikke tiltak med kortvisning, avanserte søkefilter og sømløs filhåndtering",
        link: `/prosjekt-tiltak-workspace`,
        icon: Briefcase,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        available: true, // Now implemented
      },
      {
        title: "Prosjekt Krav & Tiltak Combined",
        desc: "Unified view av prosjektspesifikke krav og tiltak med hierarkiske forhold og kryssreferanser",
        link: `/prosjekt-krav-tiltak-combined`,
        icon: Briefcase,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        available: true, // Now implemented
      },
    ];

    const handleImportObligatoryRequirements = () => {
      setShowImportWizard(true);
    };

    const handleImportComplete = () => {
      // Import complete - user can now navigate to workspace from project cards
      // No automatic navigation to avoid cache timing issues
    };

    // Check if import has been completed
    const importMetadata = project?.prosjektJson?.importMetadata;
    const hasImported = importMetadata?.completed === true;

    // Individual Project View
    return (
      <div className="bg-white min-h-screen">
        {/* Vibrant header section */}
        <section className="border-b border-sky-700 bg-sky-600">
          <div className="max-w-6xl mx-auto px-6 py-8 sm:px-8">
            {/* Back link */}
            <Link to="/" className="inline-flex items-center text-sky-100 hover:text-white transition-colors text-sm mb-6">
              <ArrowLeft size={16} className="mr-2" />
              Tilbake til prosjekter
            </Link>

            {/* Project header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-medium text-white tracking-tight">{project.navn || "Uten navn"}</h1>
                <p className="text-sky-100 mt-2 text-sm">Prosjektnummer: {project.prosjektnummer || "N/A"}</p>

                {/* Meta information */}
                <div className="flex items-center gap-6 mt-4 text-sm text-sky-50">
                  {project.enhet && (
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-sky-200" />
                      <span>{project.enhet.navn}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-sky-200" />
                    <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString("nb-NO") : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons - vibrant and crisp */}
              <div className="flex flex-col gap-2 ml-8">
                {project.beskrivelse && (
                  <button
                    onClick={() => setShowFullDescription(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-normal backdrop-blur-sm"
                  >
                    <FileText size={16} />
                    Vis beskrivelse
                  </button>
                )}
                {hasImported && (
                  <button
                    onClick={handleImportObligatoryRequirements}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-sky-50 text-sky-600 rounded-lg transition-colors text-sm font-normal shadow-sm"
                  >
                    <Download size={16} />
                    Re-importer krav
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Clean modal */}
        {showFullDescription && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6 z-50"
            onClick={() => setShowFullDescription(false)}
          >
            <div
              className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                <h2 className="text-xl font-medium text-gray-900">Prosjektinformasjon</h2>
                <button
                  onClick={() => setShowFullDescription(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-88px)] space-y-8">
                {/* Project Description */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Beskrivelse</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ExpandableRichText
                      content={project.beskrivelse}
                      maxLength={Infinity}
                      className="text-gray-700"
                    />
                  </div>
                </div>

                {/* Import Section in Modal (only show if imported) */}
                {hasImported && (
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-base font-medium text-gray-900 mb-3">Import av krav</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-green-900 flex items-center mb-2">
                            <Download size={16} className="mr-2" />
                            Krav importert
                          </h4>
                          <p className="text-green-700 text-sm mb-3">
                            Obligatoriske krav har blitt importert til prosjektet.
                          </p>
                          <div className="text-xs text-green-600 space-y-1">
                            <p>Importert: {new Date(importMetadata.timestamp).toLocaleString('nb-NO')}</p>
                            {importMetadata.importedCounts && (
                              <p>
                                {importMetadata.importedCounts.krav} krav og {importMetadata.importedCounts.tiltak || 0} tiltak importert
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImportObligatoryRequirements();
                          }}
                          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-normal whitespace-nowrap"
                        >
                          <Download size={14} className="inline mr-1" />
                          Re-importer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <section className="max-w-6xl mx-auto px-6 py-16 sm:px-8">
          {/* Import section - only show if not imported yet */}
          {!hasImported && (
            <div className="mb-16">
              <div className="border border-sky-200 rounded-lg p-6 bg-sky-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-base font-medium mb-2 flex items-center text-gray-900">
                      <Download size={18} className="mr-2 text-sky-600" />
                      Importer obligatoriske krav
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Importer alle obligatoriske generelle krav og tiltak til dette prosjektet. Dette vil kopiere relevante krav som må følges opp i prosjektet.
                    </p>
                  </div>

                  <div className="flex items-center ml-6">
                    <button
                      onClick={handleImportObligatoryRequirements}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-normal whitespace-nowrap"
                    >
                      <Download size={16} className="inline mr-2" />
                      Importer krav
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project modules */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-8">Moduler</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projectCards.map((card) => {
                const IconComponent = card.icon;
                const isAvailable = card.available;

                if (isAvailable) {
                  return (
                    <Link
                      key={card.title}
                      to={card.link}
                      state={{ returnTo: location.pathname }}
                      className="group block"
                    >
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 h-full hover:border-sky-300 hover:shadow-md transition-all">
                        <div className={`inline-flex p-2.5 rounded-lg ${card.iconBg} ${card.iconColor} mb-4`}>
                          <IconComponent size={20} />
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-2">
                          {card.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                        <div className="flex items-center mt-4 text-sky-600 text-sm font-medium">
                          <span>Åpne</span>
                          <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  );
                } else {
                  return (
                    <div key={card.title} className="block cursor-not-allowed">
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 h-full">
                        <div className="inline-flex p-2.5 rounded-lg bg-gray-200 text-gray-400 mb-4">
                          <IconComponent size={20} />
                        </div>
                        <h3 className="text-base font-medium text-gray-500 mb-2">{card.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4">{card.desc}</p>
                        <div className="flex items-center text-gray-400 text-sm">
                          <span>Kommer snart</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </section>

        {/* Import Wizard */}
        <ImportKravWizard
          open={showImportWizard}
          onClose={() => setShowImportWizard(false)}
          projectId={project?.id}
          onImportComplete={handleImportComplete}
        />

        {/* Create Project Modal */}
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
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

      // Track project visit using the store
      trackProjectVisit(fullProject, user?.id);

      // Navigate to project landing page with current project context
      navigate(`/prosjekt/${project.id}`);
    } catch (error) {
      // Continue navigation even if some operations fail
      console.error("Failed to open project:", error);

      // At minimum, set the basic project info we have and track the visit
      setCurrentProject(project);
      trackProjectVisit(project, user?.id);
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
                <Link to="/tiltak-workspace?preset=generelle" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
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
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border-2 border-sky-200 p-6 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Plus size={28} className="text-sky-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Opprett nytt prosjekt</h2>
            <p className="text-gray-600 mb-6">Start et nytt prosjekt med krav og tiltak</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-6 py-2.5 font-medium shadow-sm transition-all hover:shadow"
            >
              Nytt prosjekt
            </button>
          </div>

          {/* Recent projects */}
          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Sist brukte prosjekter</h2>
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
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
                      className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 transition-colors ml-4"
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1 bg-sky-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm hover:shadow"
            >
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
                    <button onClick={() => handleProjectOpen(project)} className="text-sky-600 hover:text-sky-900 transition-colors">
                      Åpne<span className="sr-only">, {project.navn}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
