import { Scale, Package } from "lucide-react";
import InfoSection from "../InfoSection.jsx";
import KravUnifiedField from "../../KravUnifiedField.jsx";
import { shouldRenderKravField } from "@/utils/kravFieldVisibility.js";

/**
 * Section displaying legal foundations and standards for Krav
 */
const LegalSection = ({ krav, expandedSections, onToggleSection, mode = "view", form, isEditing, errors, getField, handleFieldChange }) => {
  // Get current operation type for visibility check
  const operation = mode === "view" ? "view" : (mode === "create" ? "create" : "edit");
  return (
    <InfoSection
      title="Juridisk grunnlag & standarder"
      icon={Scale}
      collapsible={true}
      section="juridisk"
      isExpanded={expandedSections.juridisk}
      onToggle={onToggleSection}
    >
      <div className="space-y-4">
        {/* Kravreferanse - First row, full width */}
        {shouldRenderKravField(getField("kravreferanse"), operation) && (
          <>
            {mode === "view" ? (
              krav.kravreferanse && (
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-2 block">Kravreferanse</label>
                  <p className="text-sm text-neutral-900">{krav.kravreferanse}</p>
                </div>
              )
            ) : (
              <KravUnifiedField
                field={getField("kravreferanse")}
                value={isEditing ? form.kravreferanse : krav?.kravreferanse}
                data={krav}
                mode={mode}
                onChange={(value) => handleFieldChange("kravreferanse", value)}
                error={errors.kravreferanse}
                form={form}
              />
            )}
          </>
        )}
        
        {/* Lover og Forskrifter and Kravpakker - Side by side */}
        {(shouldRenderKravField(getField("lover"), operation) || shouldRenderKravField(getField("kravpakker"), operation)) && (
          <div className="grid grid-cols-2 gap-6">
            {/* Laws and Regulations */}
            {shouldRenderKravField(getField("lover"), operation) && (
              <div>
                {mode === "view" ? (
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Lover og forskrifter</label>
                    {krav.lover?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {krav.lover.map((lov, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                            <Scale size={12} />
                            {lov.tittel || lov.navn || `Lov ${lov.id}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 italic">Ingen lover eller forskrifter</p>
                    )}
                  </div>
                ) : (
                  <KravUnifiedField
                    field={getField("lover")}
                    value={isEditing ? form.lover : krav?.lover}
                    data={krav}
                    mode={mode}
                    onChange={(value) => handleFieldChange("lover", value)}
                    error={errors.lover}
                    form={form}
                  />
                )}
              </div>
            )}

            {/* Requirements Packages */}
            {shouldRenderKravField(getField("kravpakker"), operation) && (
              <div>
                {mode === "view" ? (
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">Kravpakker</label>
                    {krav.kravpakker?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {krav.kravpakker.map((pakke, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <Package size={12} />
                            {pakke.tittel || pakke.navn || `Kravpakke ${pakke.id}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 italic">Ingen kravpakker</p>
                    )}
                  </div>
                ) : (
                  <KravUnifiedField
                    field={getField("kravpakker")}
                    value={isEditing ? form.kravpakker : krav?.kravpakker}
                    data={krav}
                    mode={mode}
                    onChange={(value) => handleFieldChange("kravpakker", value)}
                    error={errors.kravpakker}
                    form={form}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </InfoSection>
  );
};

export default LegalSection;
