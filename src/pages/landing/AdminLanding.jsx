import React, { useState, useMemo } from "react";
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
  FolderTree,
  ChevronDown,
  Tag,
} from "lucide-react";
import { useUserStore, useProjectStore } from "@/stores/userStore";
import { getModelConfig } from "@/modelConfigs";

export default function AdminLanding() {
  const { user } = useUserStore();
  const { currentProject } = useProjectStore();
  const isAdmin = user?.rolle === "ADMIN";

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    kravTiltak: true,
    administrasjon: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Build URL params for workspace links to preserve context
  const workspaceParams = useMemo(() => {
    const params = new URLSearchParams();
    if (user?.fagomradeId) {
      params.set('fagomradeId', user.fagomradeId);
    }
    if (currentProject?.id) {
      params.set('projectId', currentProject.id);
    }
    const paramString = params.toString();
    return paramString ? `?${paramString}` : '';
  }, [user?.fagomradeId, currentProject?.id]);

  // Krav & Tiltak Workspaces
  const kravTiltakCards = [
    {
      config: {
        title: "Krav Workspace",
        desc: "Modern kravhåndtering med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/krav-workspace",
      icon: Briefcase,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      config: {
        title: "Tiltak Workspace",
        desc: "Modern tiltakshåndtering med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/tiltak-workspace",
      icon: Briefcase,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      config: {
        title: "Krav & Tiltak Combined",
        desc: "Unified view av krav og tiltak med hierarkiske forhold og kryssreferanser",
      },
      link: "/krav-tiltak-combined",
      icon: Layers,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  // Administration cards (everything else)
  const administrasjonCards = [
    {
      config: getModelConfig("users"),
      link: "/admin",
      icon: Users,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      config: getModelConfig("enheter"),
      link: "/enheter",
      icon: Building2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      config: getModelConfig("fagomrader"),
      link: "/fagomrader",
      icon: FolderTree,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      config: getModelConfig("emner"),
      link: "/emner",
      icon: Tag,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      config: getModelConfig("prosjekter"),
      link: "/prosjekter",
      icon: Building,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      config: getModelConfig("status"),
      link: "/status",
      icon: Activity,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      config: getModelConfig("vurderinger"),
      link: "/vurderinger",
      icon: Star,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      config: getModelConfig("kravpakker"),
      link: "/kravpakker",
      icon: Package,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      config: getModelConfig("kravreferansetyper"),
      link: "/kravreferansetyper",
      icon: Link2,
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      config: getModelConfig("lover"),
      link: "/lover",
      icon: Scale,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      config: getModelConfig("krav"),
      link: "/krav",
      icon: CheckSquare,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      config: getModelConfig("tiltak"),
      link: "/tiltak",
      icon: CheckSquare,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      config: getModelConfig("prosjektKrav"),
      link: "/prosjekt-krav",
      icon: CheckSquare,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      config: getModelConfig("prosjektTiltak"),
      link: "/prosjekt-tiltak",
      icon: CheckSquare,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      config: {
        title: "Prosjekt Krav Workspace",
        desc: "Modern håndtering av prosjektspesifikke krav med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/prosjekt-krav-workspace",
      icon: Briefcase,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      config: {
        title: "Prosjekt Tiltak Workspace",
        desc: "Modern håndtering av prosjektspesifikke tiltak med kortvisning, avanserte søkefilter og sømløs filhåndtering",
      },
      link: "/prosjekt-tiltak-workspace",
      icon: Briefcase,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      config: {
        title: "Prosjekt Krav & Tiltak Combined",
        desc: "Unified view av prosjektspesifikke krav og tiltak med hierarkiske forhold og kryssreferanser",
      },
      link: "/prosjekt-krav-tiltak-combined",
      icon: Layers,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      config: getModelConfig("files"),
      link: "/Files",
      icon: FolderOpen,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
  ];

  const CollapsibleSection = ({ title, isExpanded, onToggle, children }) => {
    return (
      <div className="space-y-6">
        {/* Collapsible section header - matching FieldSection style */}
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center text-left hover:bg-slate-50/60 transition-all duration-200 py-3 px-0 rounded-xl gap-3 group"
        >
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />
          <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex-1 h-px bg-slate-200 ml-4" />
        </button>

        {/* Content area */}
        {isExpanded && (
          <div className="pt-4 pl-7">
            {children}
          </div>
        )}
      </div>
    );
  };

  const CardGrid = ({ cards, appendParams = false }) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const linkTo = appendParams ? `${card.link}${workspaceParams}` : card.link;
        return (
          <Link key={card.link} to={linkTo} className="group block">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 h-full hover:border-sky-300 hover:shadow-md transition-all">
              <div className={`inline-flex p-2.5 rounded-lg ${card.iconBg} ${card.iconColor} mb-4`}>
                <IconComponent size={20} />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                {card.config.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">{card.config.desc}</p>
              <div className="flex items-center mt-4 text-sky-600 text-sm font-medium">
                <span>Åpne</span>
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
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Vibrant header */}
      <section className="bg-sky-600 border-b border-sky-700">
        <div className="max-w-6xl mx-auto px-6 py-20 sm:px-8 text-center">
          <h1 className="text-4xl font-medium tracking-tight text-white sm:text-5xl">Administrasjon</h1>
          <p className="max-w-2xl mx-auto mt-4 text-sky-50 leading-relaxed">
            Administrer systeminnstillinger og konfigurasjoner
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:px-8">
        {isAdmin ? (
          <div className="space-y-8">
            {/* Krav & Tiltak Section */}
            <CollapsibleSection
              title="Krav & Tiltak"
              isExpanded={expandedSections.kravTiltak}
              onToggle={() => toggleSection('kravTiltak')}
            >
              <CardGrid cards={kravTiltakCards} appendParams={true} />
            </CollapsibleSection>

            {/* Administration Section */}
            <CollapsibleSection
              title="Administrasjon"
              isExpanded={expandedSections.administrasjon}
              onToggle={() => toggleSection('administrasjon')}
            >
              <CardGrid cards={administrasjonCards} appendParams={false} />
            </CollapsibleSection>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-red-800 mb-2">Ingen tilgang</h3>
              <p className="text-red-600">Du har ikke administratortilgang til dette området.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
