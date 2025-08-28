import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Building,
  Activity,
  Star,
  Package,
  FileText,
  Briefcase,
  Link2,
  Scale,
  CheckSquare,
  FolderOpen,
  Layers,
} from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { getModelConfig } from "@/modelConfigs";

export default function AdminLanding() {
  const { user } = useUserStore();
  const isAdmin = user?.rolle === "ADMIN";

  const adminCards = [
    {
      config: getModelConfig("users"),
      link: "/admin",
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      config: getModelConfig("enheter"),
      link: "/enheter",
      icon: Building2,
      color: "from-green-500 to-green-600",
    },
    {
      config: getModelConfig("prosjekter"),
      link: "/prosjekter",
      icon: Building,
      color: "from-green-500 to-green-600",
    },
    {
      config: getModelConfig("status"),
      link: "/status",
      icon: Activity,
      color: "from-orange-500 to-orange-600",
    },
    {
      config: getModelConfig("vurderinger"),
      link: "/vurderinger",
      icon: Star,
      color: "from-purple-500 to-purple-600",
    },
    {
      config: getModelConfig("kravpakker"),
      link: "/kravpakker",
      icon: Package,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      config: getModelConfig("kravreferansetyper"),
      link: "/kravreferansetyper",
      icon: Link2,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      config: getModelConfig("lover"),
      link: "/lover",
      icon: Scale,
      color: "from-amber-500 to-amber-600",
    },
    {
      config: getModelConfig("krav"),
      link: "/krav",
      icon: CheckSquare,
      color: "from-red-500 to-red-600",
    },
    {
      config: getModelConfig("tiltak"),
      link: "/tiltak",
      icon: CheckSquare,
      color: "from-red-500 to-red-600",
    },
    {
      config: getModelConfig("prosjektKrav"),
      link: "/prosjekt-krav",
      icon: CheckSquare,
      color: "from-orange-500 to-orange-600",
    },
    {
      config: getModelConfig("prosjektTiltak"),
      link: "/prosjekt-tiltak",
      icon: CheckSquare,
      color: "from-teal-500 to-teal-600",
    },
    {
      config: {
        title: "Krav Workspace",
        desc: "Modern kravhåndtering med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/krav-workspace",
      icon: Briefcase,
      color: "from-blue-500 to-indigo-600",
    },
    {
      config: {
        title: "Tiltak Workspace",
        desc: "Modern tiltakshåndtering med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/tiltak-workspace",
      icon: Briefcase,
      color: "from-green-500 to-green-600",
    },
    {
      config: {
        title: "Krav & Tiltak Combined",
        desc: "Unified view av krav og tiltak med hierarkiske forhold og kryssreferanser",
      },
      link: "/combined-workspace",
      icon: Layers,
      color: "from-violet-500 to-purple-600",
    },
    {
      config: {
        title: "Prosjekt Krav Workspace",
        desc: "Modern håndtering av prosjektspesifikke krav med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/prosjekt-krav-workspace",
      icon: Briefcase,
      color: "from-orange-500 to-orange-600",
    },
    {
      config: {
        title: "Prosjekt Tiltak Workspace",
        desc: "Modern håndtering av prosjektspesifikke tiltak med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/prosjekt-tiltak-workspace",
      icon: Briefcase,
      color: "from-teal-500 to-teal-600",
    },
    {
      config: {
        title: "Prosjekt Krav & Tiltak Combined",
        desc: "Unified view av prosjektspesifikke krav og tiltak med hierarkiske forhold og kryssreferanser",
      },
      link: "/prosjekt-combined-workspace",
      icon: Layers,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      config: getModelConfig("files"),
      link: "/Files",
      icon: FolderOpen,
      color: "from-slate-500 to-slate-600",
    },
  ];

  return (
    <div className="bg-background-primary min-h-screen">
      {/* Hero section */}
      <section className="bg-primary-900 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Administrasjon</h1>
            <p className="text-primary-100 mt-2">Administrer systeminnstillinger</p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
        {isAdmin ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <Link key={card.config.title} to={card.link} className="group block transform transition-all duration-200 hover:scale-105">
                  <div className="card-base card-hover rounded-xl p-6 h-full transition-all duration-200 group-hover:shadow-xl">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${card.color} text-white mb-4 shadow-md`}>
                      <IconComponent size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary-700 transition-colors">
                      {card.config.title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{card.config.desc}</p>
                    <div className="flex items-center mt-4 text-primary-600 font-medium text-sm">
                      <span>Åpne administrasjon</span>
                      <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
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
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-red-800 mb-2">Ingen tilgang</h3>
              <p className="text-red-600">Du har ikke administratortilgang til dette området.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
