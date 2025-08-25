import { Paperclip } from "lucide-react";
import InfoSection from "../InfoSection.jsx";
import FileUpload from "@/components/forms/FileUpload.jsx";

/**
 * Section displaying file attachments for Krav
 */
const FilesSection = ({ krav, expandedSections, onToggleSection, mode = "view" }) => {
  const canUpload = mode === "edit" || mode === "create";

  return (
    <InfoSection
      title="Vedlegg"
      icon={Paperclip}
      collapsible={true}
      section="files"
      isExpanded={expandedSections.files}
      onToggle={onToggleSection}
    >
      <FileUpload
        files={krav.files || []}
        relatedModelType="krav"
        relatedModelId={krav.id}
        showUpload={canUpload}
        showTitle={false}
        thumbnailSize="medium"
      />
    </InfoSection>
  );
};

export default FilesSection;
