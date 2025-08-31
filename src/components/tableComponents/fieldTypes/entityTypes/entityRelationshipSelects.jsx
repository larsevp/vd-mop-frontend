import React from "react";
import { KravSelect } from "../../../ui/form/KravSelect";
import { TiltakSelect } from "../../../ui/form/TiltakSelect";
import { ProsjektKravSelect } from "../../../ui/form/ProsjektKravSelect";
import { ProsjektTiltakSelect } from "../../../ui/form/ProsjektTiltakSelect";
import { useEmneInheritance } from "../../../../hooks/useEmneInheritance";

// General entity relationship selects (can be used across models)
export const entityRelationshipSelects = {
  kravselect: ({ field, value, onChange, error, formData, form, row, data, setFormData }) => {
    const currentData = formData || form || row || data || {};

    // Check for mutual exclusivity - if krav connection exists, disable parent selection
    const hasKravConnection =
      (currentData.krav && currentData.krav.length > 0) || (currentData.prosjektKrav && currentData.prosjektKrav.length > 0);

    return (
      <KravSelect
        name={field.name}
        value={value}
        onChange={(changeEvent) => {
          // When parent is selected, clear any krav connections
          if (field.name === "parentId" && changeEvent.target.value) {
            if (currentData.krav) currentData.krav = [];
            if (currentData.prosjektKrav) currentData.prosjektKrav = [];
          }

          onChange(changeEvent);
        }}
        label={field.label}
        required={field.required}
        placeholder={hasKravConnection ? "Deaktivert - fjern krav-tilknytning først" : field.placeholder}
        excludeId={row?.id}
        disabled={hasKravConnection}
        error={error}
      />
    );
  },

  prosjektKravselect: ({ field, value, onChange, error, formData, form, row, data, setFormData }) => {
    const { 
      handleParentSelection, 
      isFieldDisabled, 
      getDisabledPlaceholder,
      hasParentConnection,
      hasRelatedEntityConnection
    } = useEmneInheritance('prosjektKrav');
    
    const disabled = isFieldDisabled('parent') || field.disabled;
    const placeholder = getDisabledPlaceholder('parent') || field.placeholder;

    return (
      <ProsjektKravSelect
        name={field.name}
        value={value}
        onChange={onChange}
        onDataLoaded={(kravData) => {
          // Initialize store when data loads and there's an existing parentId value
          if (field.name === "parentId" && value && !hasParentConnection && kravData.length > 0) {
            const existingKrav = kravData.find(k => k.id === value);
            if (existingKrav?.emneId) {
              handleParentSelection(value, existingKrav, 'prosjektKrav');
            }
          }
        }}
        onKravSelected={(selectedKrav) => {
          // Handle inheritance logic via the store when krav is selected
          if (field.name === "parentId") {
            if (selectedKrav?.emneId) {
              handleParentSelection(selectedKrav.id, selectedKrav, 'prosjektKrav');
            } else if (selectedKrav === null) {
              handleParentSelection(null, null);
            }
          }
        }}
        label={field.label}
        required={field.required}
        placeholder={placeholder}
        excludeId={row?.id}
        disabled={disabled}
        error={error}
      />
    );
  },

  tiltakselect: ({ field, value, onChange, error, formData, form, row, data, setFormData }) => {
    const { 
      handleParentSelection, 
      isFieldDisabled, 
      getDisabledPlaceholder,
      hasParentConnection,
      hasRelatedEntityConnection
    } = useEmneInheritance('tiltak');
    
    const disabled = isFieldDisabled('parent') || field.disabled; // Use store logic for mutual exclusivity
    const placeholder = getDisabledPlaceholder('parent') || field.placeholder;

    return (
      <TiltakSelect
        name={field.name}
        value={value}
        onChange={onChange} // Simple form onChange
        onDataLoaded={(tiltakData) => {
          // Initialize store when data loads and there's an existing parentId value
          if (field.name === "parentId" && value && !hasParentConnection && tiltakData.length > 0) {
            const existingTiltak = tiltakData.find(t => t.id === value);
            if (existingTiltak?.emneId) {
              handleParentSelection(value, existingTiltak, 'tiltak');
            }
          }
        }}
        onTiltakSelected={(selectedTiltak) => {
          // Handle inheritance logic via the store when tiltak is selected
          if (field.name === "parentId") {
            if (selectedTiltak?.emneId) {
              // Use the store to handle inheritance and mutual exclusivity
              handleParentSelection(selectedTiltak.id, selectedTiltak, 'tiltak');
            } else if (selectedTiltak === null) {
              // Clear parent connection when selection is cleared
              handleParentSelection(null, null);
            }
          }
        }}
        label={field.label}
        required={field.required}
        placeholder={placeholder}
        excludeId={row?.id}
        disabled={disabled}
        error={error}
      />
    );
  },

  prosjektTiltakselect: ({ field, value, onChange, error, formData, form, row, data, setFormData }) => {
    const { 
      handleParentSelection, 
      isFieldDisabled, 
      getDisabledPlaceholder,
      hasParentConnection,
      hasRelatedEntityConnection
    } = useEmneInheritance('prosjektTiltak');
    
    const disabled = isFieldDisabled('parent') || field.disabled;
    const placeholder = getDisabledPlaceholder('parent') || field.placeholder;

    return (
      <ProsjektTiltakSelect
        name={field.name}
        value={value}
        onChange={onChange}
        onDataLoaded={(tiltakData) => {
          // Initialize store when data loads and there's an existing parentId value
          if (field.name === "parentId" && value && !hasParentConnection && tiltakData.length > 0) {
            const existingTiltak = tiltakData.find(t => t.id === value);
            if (existingTiltak?.emneId) {
              handleParentSelection(value, existingTiltak, 'prosjektTiltak');
            }
          }
        }}
        onTiltakSelected={(selectedTiltak) => {
          // Handle inheritance logic via the store when tiltak is selected
          if (field.name === "parentId") {
            if (selectedTiltak?.emneId) {
              handleParentSelection(selectedTiltak.id, selectedTiltak, 'prosjektTiltak');
            } else if (selectedTiltak === null) {
              handleParentSelection(null, null);
            }
          }
        }}
        label={field.label}
        required={field.required}
        placeholder={placeholder}
        excludeId={row?.id}
        disabled={disabled}
        error={error}
      />
    );
  },
};
