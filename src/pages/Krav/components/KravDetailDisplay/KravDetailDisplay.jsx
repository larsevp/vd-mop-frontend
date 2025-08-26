import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, AlertTriangle, Building2, Users, ChevronDown, MessageSquare } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useUserStore } from "@/stores/userStore";

import KravUnifiedField from "../KravUnifiedField.jsx";
import InfoSection from "./InfoSection.jsx";
import KravHeader from "./KravHeader.jsx";
import LegalSection from "./sections/LegalSection.jsx";
import HierarchySection from "./sections/HierarchySection.jsx";
import MetadataSection from "./sections/MetadataSection.jsx";
import FilesSection from "./sections/FilesSection.jsx";
import { useKravForm } from "./hooks/useKravForm.js";
import { ExpandableRichText } from "@/components/tableComponents/displayValues/ExpandableRichText.jsx";

/**
 * Unified Krav display component that handles view, edit, and create modes
 * Maintains consistent layout and sectioning across all modes
 */
const KravDetailDisplay = ({
  krav,
  mode = "view",
  onEdit,
  onSave,
  onCancel,
  onNavigateToKrav,
  displayResolver,
  modelConfig,
  isInlineExpanded = false,
}) => {
  // Get current user for default values
  const { user } = useUserStore();

  // Helper function to render Lucide icons dynamically
  const renderLucideIcon = (iconName, size = 20) => {
    if (!iconName) return null;

    const formattedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    const IconComponent = LucideIcons[formattedIconName] || LucideIcons[iconName];

    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in Lucide icons`);
      return null;
    }

    return <IconComponent size={size} />;
  };
  // For existing krav in view/edit mode, fetch complete data including all fields
  const { data: fullKrav } = useQuery({
    queryKey: ["krav-detail", krav?.id],
    queryFn: () => modelConfig.getByIdFn(krav.id),
    enabled: !!krav?.id && mode !== "create", // Only fetch for existing krav, not for create mode
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use complete data if available, otherwise fall back to prop data
  const kravData = fullKrav?.data || krav;

  const { form, errors, loading, isEditing, getField, handleFieldChange, handleSubmit } = useKravForm({
    krav: kravData,
    mode,
    modelConfig,
    onSave,
    user, // Pass user for default values
  });

  const [expandedSections, setExpandedSections] = useState({
    informasjon: true,
    merknader: true,
    juridisk: true, // Show legal section by default since it's now prominent
    alleDetaljer: false, // Closed by default
    organisasjon: false,
    relasjoner: false,
    files: true,
    underkrav: true,
    metadata: false,
  });

  const childKrav = kravData?.children || [];

  // List of sections that are inside "alle detaljer"
  const alleDetaljerSubSections = ["organisasjon", "relasjoner", "underkrav", "files", "metadata"];

  const toggleSection = (section) => {
    if (section === "alleDetaljer") {
      // Special handling for "alle detaljer" - toggle all sub-sections
      setExpandedSections((prev) => {
        const newAlleDetaljerState = !prev.alleDetaljer;
        const updates = { alleDetaljer: newAlleDetaljerState };

        // When expanding alleDetaljer, expand all sub-sections
        // When collapsing alleDetaljer, collapse all sub-sections
        alleDetaljerSubSections.forEach((subSection) => {
          updates[subSection] = newAlleDetaljerState;
        });

        return { ...prev, ...updates };
      });
    } else {
      // Normal toggle for individual sections
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    }
  };

  const containerClass = isInlineExpanded
    ? "bg-white" // Simple container for inline cards
    : "bg-neutral-50 rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col"; // Modal-style container

  return (
    <div className={containerClass}>
      {/* Header - Only show in modal mode */}
      {!isInlineExpanded && (
        <KravHeader krav={kravData} mode={mode} loading={loading} onEdit={onEdit} onCancel={onCancel} onSubmit={handleSubmit} />
      )}

      {/* Scrollable Content */}
      <div className={isInlineExpanded ? "p-6 space-y-6" : "flex-1 overflow-y-auto p-6 space-y-6"}>
        {/* Main Content - Title and Description */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm space-y-6">
          {/* Title - Large and prominent */}
          <div>
            {mode === "view" ? (
              <h1 className="text-3xl font-bold text-neutral-900 leading-tight">{kravData?.tittel || "Uten tittel"}</h1>
            ) : (
              <KravUnifiedField
                field={getField("tittel")}
                value={isEditing ? form.tittel : kravData?.tittel}
                data={kravData}
                mode={mode}
                onChange={(value) => handleFieldChange("tittel", value)}
                error={errors.tittel}
                form={form}
              />
            )}
          </div>

          {/* Description - Distinct but secondary */}
          <div>
            {mode === "view" ? (
              <div className="text-lg leading-relaxed text-neutral-700">
                {kravData?.beskrivelse ? (
                  <ExpandableRichText content={kravData.beskrivelse} maxLength={500} />
                ) : (
                  <span className="text-neutral-500 italic">Ingen beskrivelse</span>
                )}
              </div>
            ) : (
              <KravUnifiedField
                field={getField("beskrivelse")}
                value={isEditing ? form.beskrivelse : kravData?.beskrivelse}
                data={kravData}
                mode={mode}
                onChange={(value) => handleFieldChange("beskrivelse", value)}
                error={errors.beskrivelse}
                form={form}
              />
            )}
          </div>

          {/* Emne Information */}
          <div className="border-t border-neutral-100 pt-4 mt-6">
            {mode === "view" ? (
              // View mode - show emne info if available
              kravData?.emne ? (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-neutral-500">Emne:</span>
                  <div className="flex items-center gap-2">
                    {/* Small Emne Icon */}
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: kravData.emne.color || "#6b7280" }}
                    >
                      {kravData.emne.icon ? renderLucideIcon(kravData.emne.icon, 14) : <FileText size={14} />}
                    </div>
                    <span className="font-medium text-neutral-900">{kravData.emne.tittel}</span>
                    {kravData.emne.beskrivelse && <span className="text-neutral-600">— {kravData.emne.beskrivelse}</span>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-neutral-500">Emne:</span>
                  <span className="text-neutral-400 italic">Ikke tilknyttet et emne</span>
                </div>
              )
            ) : (
              // Edit/Create mode - show emne field for selection
              <KravUnifiedField
                field={getField("emneId")}
                value={isEditing ? form.emneId : kravData?.emneId}
                data={kravData}
                mode={mode}
                onChange={(value) => handleFieldChange("emneId", value)}
                error={errors.emneId}
                form={form}
              />
            )}
          </div>
        </div>

        {/* Additional Information */}
        <InfoSection
          title="Detaljert informasjon"
          icon={AlertTriangle}
          collapsible={true}
          section="informasjon"
          isExpanded={expandedSections.informasjon}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            <KravUnifiedField
              field={getField("informasjon")}
              value={isEditing ? form.informasjon : kravData?.informasjon}
              data={kravData}
              mode={mode}
              onChange={(value) => handleFieldChange("informasjon", value)}
              error={errors.informasjon}
              form={form}
            />
          </div>
        </InfoSection>

        {/* Merknader */}
        <InfoSection
          title="Merknader"
          icon={MessageSquare}
          collapsible={true}
          section="merknader"
          isExpanded={expandedSections.merknader}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            <KravUnifiedField
              field={getField("merknader")}
              value={isEditing ? form.merknader : kravData?.merknader}
              data={kravData}
              mode={mode}
              onChange={(value) => handleFieldChange("merknader", value)}
              error={errors.merknader}
              form={form}
            />
          </div>
        </InfoSection>

        {/* Legal Foundation - Moved above "All Details" */}
        <LegalSection
          krav={kravData || {}}
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          mode={mode}
          form={form}
          isEditing={isEditing}
          errors={errors}
          getField={getField}
          handleFieldChange={handleFieldChange}
        />

        {/* All Additional Details - Collapsible Wrapper */}
        <InfoSection
          title="Alle detaljer"
          icon={ChevronDown}
          collapsible={true}
          section="alleDetaljer"
          isExpanded={expandedSections.alleDetaljer}
          onToggle={toggleSection}
        >
          <div className="space-y-6">
            {/* Organization & Context */}
            <InfoSection
              title="Organisasjon & kontekst"
              icon={Building2}
              collapsible={true}
              section="organisasjon"
              isExpanded={expandedSections.organisasjon}
              onToggle={toggleSection}
            >
              <div className="grid grid-cols-2 gap-4">
                <KravUnifiedField
                  field={getField("enhetId")}
                  value={isEditing ? form.enhetId : kravData?.enhetId}
                  data={kravData}
                  mode={mode}
                  onChange={(value) => handleFieldChange("enhetId", value)}
                  error={errors.enhetId}
                  form={form}
                />
                <KravUnifiedField
                  field={getField("obligatorisk")}
                  value={isEditing ? form.obligatorisk : kravData?.obligatorisk}
                  data={kravData}
                  mode={mode}
                  onChange={(value) => handleFieldChange("obligatorisk", value)}
                  error={errors.obligatorisk}
                  form={form}
                />
                <KravUnifiedField
                  field={getField("prioritet")}
                  value={isEditing ? form.prioritet : kravData?.prioritet}
                  data={kravData}
                  mode={mode}
                  onChange={(value) => handleFieldChange("prioritet", value)}
                  error={errors.prioritet}
                  form={form}
                />
              </div>
            </InfoSection>

            {/* Relationships */}
            <InfoSection
              title="Relasjoner"
              icon={Users}
              collapsible={true}
              section="relasjoner"
              isExpanded={expandedSections.relasjoner}
              onToggle={toggleSection}
            >
              <div className="space-y-4">
                <KravUnifiedField
                  field={getField("parentId")}
                  value={isEditing ? form.parentId : kravData?.parentId}
                  data={kravData}
                  mode={mode}
                  onChange={(value) => handleFieldChange("parentId", value)}
                  error={errors.parentId}
                  form={form}
                />
              </div>
            </InfoSection>


            {/* Hierarchy */}
            <HierarchySection
              krav={kravData || {}}
              childKrav={childKrav}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
              onNavigateToKrav={onNavigateToKrav}
            />

            {/* Files */}
            <FilesSection krav={kravData || {}} expandedSections={expandedSections} onToggleSection={toggleSection} mode={mode} />

            {/* Metadata */}
            <MetadataSection krav={kravData || {}} expandedSections={expandedSections} onToggleSection={toggleSection} />
          </div>
        </InfoSection>

        {/* Action Buttons for Inline Mode */}
        {isInlineExpanded && (mode === "edit" || mode === "create") && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Lagrer...
                </div>
              ) : mode === "create" ? (
                "Opprett"
              ) : (
                "Lagre"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KravDetailDisplay;
