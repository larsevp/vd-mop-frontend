import React from "react";
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

export default function LandingPage() {
  const { user } = useUserStore();
  const isAdmin = user?.rolle === "ADMIN";
  const navigate = useNavigate();

  function newProject() {
    navigate("/prosjekter/ny", {
      state: { modelType: "prosjekter" },
    });
  }

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
    // Use queryLoading instead of isLoading
    return (
      <div className="bg-background-primary min-h-screen">
        {/* Hero section skeleton */}
        <section className="bg-primary-900 text-white">
          <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-12 sm:px-6 md:px-8">
            <div className="text-center">
              <Skeleton height={40} width={200} className="mx-auto" />
              <Skeleton height={20} width={300} className="mx-auto mt-4" />
            </div>
          </div>
        </section>

        {/* Main content skeleton */}
        <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick access card skeleton */}
            <div className="bg-primary-50 rounded-xl border border-primary-100 p-6 shadow-sm">
              <Skeleton height={20} width={150} className="mb-4" />
              <ul className="space-y-3">
                <Skeleton height={15} width={200} />
                <Skeleton height={15} width={200} />
                <Skeleton height={15} width={200} />
              </ul>
            </div>

            {/* New project card skeleton */}
            <div className="bg-primary-50 rounded-xl border border-primary-100 p-6 shadow-sm">
              <Skeleton height={20} width={150} className="mb-4" />
              <Skeleton height={40} width={200} />
            </div>

            {/* Recent projects skeleton */}
            <div className="md:col-span-2 lg:col-span-1">
              <Skeleton height={20} width={200} className="mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
                    <Skeleton height={20} width={150} />
                    <Skeleton height={15} width={250} className="mt-2" />
                    <Skeleton height={10} width={100} className="mt-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return <div>Feil ved lasting av prosjekter: {error.message}</div>;
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
          <HurtigtilgangLandingPage />

          {/* New project card */}

          <SimpleCard
            title="Nytt prosjekt"
            subtitle="Lag et nytt prosjekt og fyll det med tiltak"
            content={
              <button
                className="btn btn-primary rounded-lg px-5 py-2.5 font-medium shadow-sm transition-all"
                onClick={() => newProject()}
              >
                Nytt prosjekt
              </button>
            }
          />
          {/* Recent projects */}
          <RecentProjectList />
        </div>
      </section>

      <ProjectLandingTable projects={projects}> </ProjectLandingTable>
    </div>
  );
}
