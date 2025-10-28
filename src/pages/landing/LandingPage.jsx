import React, { useState } from "react";
import { getProsjekter } from "@/api/endpoints";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useNavigate } from "react-router-dom";
import { SimpleCard } from "@/components/ui";
import ProjectLandingTable from "@/components/parts/LandingPage/ProjectLandingTable";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { RecentProjectList } from "@/components/parts/LandingPage/RecentProjectList";
import HurtigtilgangLandingPage from "@/components/parts/LandingPage/HurtigtilgangLandingPage";
import { OnboardingModal } from "@/components/parts/LandingPage/OnboardingModal";
import CreateProjectModal from "@/components/ui/projects/CreateProjectModal";
import { Plus } from "lucide-react";

export default function LandingPage() {
  const { user } = useUserStore();
  const isAdmin = user?.rolle === "ADMIN";
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data,
    isLoading: queryLoading,
    error,
  } = useQuery({
    queryKey: ["projects_list"],
    queryFn: getProsjekter,
    select: (res) => res.data,
    refetchOnWindowFocus: true,
  });

  const projects = data || [];

  if (queryLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header skeleton */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-16 sm:px-8 text-center">
            <Skeleton height={40} width={120} className="mx-auto" />
            <Skeleton height={16} width={400} className="mx-auto mt-4" />
          </div>
        </section>

        {/* Main content skeleton */}
        <section className="max-w-6xl mx-auto px-6 py-16 sm:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <Skeleton height={18} width={150} className="mb-3" />
                <Skeleton height={14} width={200} className="mb-4" />
                <Skeleton height={36} width={120} />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return <div>Feil ved lasting av prosjekter: {error.message}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Onboarding modal */}
      <OnboardingModal />

      {/* Vibrant but crisp header */}
      <section className="bg-blue-700 border-b border-blue-800">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:px-8 text-center">
          <h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">MOP</h1>
          <p className="max-w-2xl mx-auto mt-4 text-blue-50 leading-relaxed">
            Miljø og Prosjekthåndteringssystem for oversikt over tiltak og prosjekter
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick access card */}
          <HurtigtilgangLandingPage />

          {/* New project card */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-sky-300 hover:shadow-md transition-all h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex p-2.5 rounded-lg bg-green-100 text-green-600">
                <Plus size={20} />
              </div>
              <h3 className="text-base font-medium text-gray-900">Nytt prosjekt</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Lag et nytt prosjekt og fyll det med tiltak
            </p>
            <button
              className="w-full bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-normal shadow-sm"
              onClick={() => setShowCreateModal(true)}
            >
              Opprett prosjekt
            </button>
          </div>

          {/* Recent projects */}
          <RecentProjectList />
        </div>
      </section>

      {/* Project table */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-0 sm:px-8">
          <ProjectLandingTable projects={projects} />
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
