import React from "react";
import { Link } from "react-router-dom";
import { Book, Users, FolderOpen } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { ScrollableContainer } from "@/components/ui";

export default function HurtigtilgangLandingPage() {
  const { user } = useUserStore();
  const isAdmin = user?.rolle === "ADMIN";

  return (
    <div className="bg-primary-50 rounded-xl border border-primary-100 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-primary-900 mb-4">Hurtigtilgang</h2>

      {/* Reusable scrollable container */}
      <ScrollableContainer maxHeight="130px" fadeColor="from-primary-50" dependencies={[isAdmin]}>
        <ul className="space-y-3">
          <li>
            <Link to="/tiltak" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
              <Book size={18} />
              <span>Generelle tiltak</span>
            </Link>
          </li>

          {isAdmin && <></>}

          <li>
            <Link to="/prosjekter" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
              <FolderOpen size={18} />
              <span>Prosjektadministrasjon</span>
            </Link>
          </li>
          <li>
            <Link to="/emner" className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition-colors">
              <FolderOpen size={18} />
              <span>Emneadministrasjon</span>
            </Link>
          </li>
        </ul>
      </ScrollableContainer>
    </div>
  );
}
