import React from "react";
import { Link } from "react-router-dom";
import { Book, Users, FolderOpen, Zap } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import ScrollableContainer from "@/components/ui/layout/scrollable-container";

export default function HurtigtilgangLandingPage() {
  const { user } = useUserStore();
  const isAdmin = user?.rolle === "ADMIN";

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-sky-300 hover:shadow-md transition-all h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex p-2.5 rounded-lg bg-amber-100 text-amber-600">
          <Zap size={20} />
        </div>
        <h2 className="text-base font-medium text-gray-900">Hurtigtilgang</h2>
      </div>

      {/* Reusable scrollable container */}
      <ScrollableContainer maxHeight="180px" fadeColor="from-white" dependencies={[isAdmin]}>
        <ul className="space-y-3">
          <li>
            <Link to="/tiltak-workspace?preset=generelle" className="flex items-center gap-2 text-gray-700 hover:text-sky-600 transition-colors">
              <Book size={18} />
              <span className="text-sm">Generelle tiltak</span>
            </Link>
          </li>

          {isAdmin && <></>}

          <li>
            <Link to="/prosjekter" className="flex items-center gap-2 text-gray-700 hover:text-sky-600 transition-colors">
              <FolderOpen size={18} />
              <span className="text-sm">Prosjektadministrasjon</span>
            </Link>
          </li>
          <li>
            <Link to="/emner" className="flex items-center gap-2 text-gray-700 hover:text-sky-600 transition-colors">
              <FolderOpen size={18} />
              <span className="text-sm">Emneadministrasjon</span>
            </Link>
          </li>
        </ul>
      </ScrollableContainer>
    </div>
  );
}
