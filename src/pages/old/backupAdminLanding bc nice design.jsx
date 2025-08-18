import React from "react";
import { Link } from "react-router-dom";
import { Users, Building2, Activity, Star, Package, Settings } from "lucide-react";
import { useUserStore } from "@/stores/userStore";

export default function OldAdminLanding() {
  const { user } = useUserStore();
  const isAdmin = user?.rolle === "ADMIN";

  const adminCards = [
    {
      title: "Brukeradministrasjon",
      description: "Administrer brukere og roller i systemet",
      link: "/admin",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
    },
    {
      title: "Enhetsadministrasjon",
      description: "Administrer organisasjonsenheter og hierarkier",
      link: "/enheter",
      icon: Building2,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
    },
    {
      title: "Statusadministrasjon",
      description: "Administrer statuser og prosjektfremgang",
      link: "/status",
      icon: Activity,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      hoverColor: "hover:bg-orange-100",
    },
    {
      title: "Vurderingadministrasjon",
      description: "Administrer vurderinger og tilbakemeldinger",
      link: "/vurderinger",
      icon: Star,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
    },
    {
      title: "Kravpakker administrasjon",
      description: "Administrer kravpakker og relaterte data",
      link: "/kravpakker",
      icon: Package,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      hoverColor: "hover:bg-indigo-100",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-screen-xl mx-auto px-4 py-16 sm:py-20 sm:px-6 md:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
              <Settings size={20} />
              <span className="text-sm font-medium">Administratorpanel</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">Administrasjon</h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">Administrer brukere, enheter og systeminnstillinger fra ett sted</p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-screen-xl mx-auto px-4 py-16 sm:px-6 md:px-8">
        {isAdmin ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Velg administrasjonsområde</h2>
              <p className="text-lg text-gray-600">Klikk på et kort for å administrere det tilhørende området</p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {adminCards.map((card) => {
                const IconComponent = card.icon;
                return (
                  <Link key={card.title} to={card.link} className="group block transform transition-all duration-200 hover:scale-105">
                    <div
                      className={`${card.bgColor} ${card.hoverColor} rounded-2xl p-8 shadow-lg border border-gray-200 h-full transition-all duration-200 group-hover:shadow-xl`}
                    >
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${card.color} text-white mb-6 shadow-lg`}>
                        <IconComponent size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">{card.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{card.description}</p>
                      <div className="flex items-center mt-6 text-primary-600 font-medium">
                        <span>Åpne administrasjon</span>
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
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-red-800 mb-2">Ingen tilgang</h3>
              <p className="text-red-600">Du har ikke administratortilgang til dette området.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
