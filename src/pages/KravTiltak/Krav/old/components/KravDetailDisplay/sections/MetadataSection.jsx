import { Calendar } from "lucide-react";
import InfoSection from "../InfoSection.jsx";
import { shouldRenderKravField } from "@/utils/kravFieldVisibility.js";

/**
 * Section displaying metadata (creation, update info) for Krav
 */
const MetadataSection = ({ krav, expandedSections, onToggleSection }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "Ikke satt";
    return new Date(dateString).toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <InfoSection
      title="Metadata"
      icon={Calendar}
      collapsible={true}
      section="metadata"
      isExpanded={expandedSections.metadata}
      onToggle={onToggleSection}
    >
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="font-medium text-neutral-700">Opprettet</label>
          <p className="text-neutral-600 mt-1">{formatDate(krav.createdAt)}</p>
          {krav.creator && <p className="text-neutral-500 text-xs">av {krav.creator.navn}</p>}
        </div>
        <div>
          <label className="font-medium text-neutral-700">Oppdatert</label>
          <p className="text-neutral-600 mt-1">{formatDate(krav.updatedAt)}</p>
          {krav.updater && <p className="text-neutral-500 text-xs">av {krav.updater.navn}</p>}
        </div>
      </div>
    </InfoSection>
  );
};

export default MetadataSection;
