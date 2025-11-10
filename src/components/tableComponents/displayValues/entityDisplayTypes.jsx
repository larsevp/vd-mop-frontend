// Entity display value handlers for foreign key relationships
// These are GLOBAL FALLBACKS - model-specific overrides take priority
import React from "react";
import { IconWithText } from "../../ui/DynamicIcon";
import { getPriorityLabel } from "../../ui/form/PrioritetSelect";
import { Triangle } from "lucide-react";
import { getPriorityLevel } from "@/pages/KravTiltak/shared/config/priorityConfig";

export const ENTITY_DISPLAY_TYPES = {
  // Generic foreign key pattern fallbacks
  // These will be used when no model-specific handler is defined

  // Enhet relationships (generic fallback)
  enhetId: (row, field, context) => {
    if (row.enhet && row.enhet.navn) {
      const displayValue = row.enhet.navn;
      if (context.format === "REACT" && row.enhet.icon) {
        return <IconWithText iconName={row.enhet.icon} text={displayValue} iconColor={row.enhet.color} />;
      }
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `Enhet ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "Ingen enhet";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Status relationships (generic fallback)
  statusId: (row, field, context) => {
    if (row.status && row.status.navn) {
      const displayValue = row.status.navn;
      if (context.format === "REACT" && row.status.icon) {
        return <IconWithText iconName={row.status.icon} text={displayValue} iconColor={row.status.color} />;
      }
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `Status ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "Ingen status";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Emne relationships (generic fallback)
  emneId: (row, field, context) => {
    if (row.emne && (row.emne.tittel || row.emne.navn)) {
      const displayValue = row.emne.tittel || row.emne.navn;
      if (context.format === "REACT" && row.emne.icon) {
        return <IconWithText iconName={row.emne.icon} text={displayValue} iconColor={row.emne.color} />;
      }
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `Emne ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "Ingen emne";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Vurdering relationships (generic fallback)
  vurderingId: (row, field, context) => {
    if (row.vurdering && (row.vurdering.tittel || row.vurdering.navn)) {
      const displayValue = row.vurdering.tittel || row.vurdering.navn;
      if (context.format === "REACT" && row.vurdering.icon) {
        return <IconWithText iconName={row.vurdering.icon} text={displayValue} iconColor={row.vurdering.color} />;
      }
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `Vurdering ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "Ingen vurdering";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Parent relationships (generic fallback for hierarchical structures)
  parentId: (row, field, context) => {
    if (row.parent) {
      // Try different common name fields
      const displayValue = row.parent.tittel || row.parent.navn || row.parent.name || row.parent.tiltakUID || row.parent.kravUID;
      if (displayValue) {
        if (context.format === "REACT" && row.parent.icon) {
          return <IconWithText iconName={row.parent.icon} text={displayValue} iconColor={row.parent.color} />;
        }
        return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
      }
    }

    if (row[field.name]) {
      const displayValue = `Parent ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    const displayValue = "Ingen";
    return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
  },

  // User relationships (generic fallback)
  createdBy: (row, field, context) => {
    if (row.creator && row.creator.navn) {
      const displayValue = row.creator.navn;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `User ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "System";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  updatedBy: (row, field, context) => {
    if (row.updater && row.updater.navn) {
      const displayValue = row.updater.navn;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `User ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "Ingen oppdateringer";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Priority display (translates numbers to user-friendly labels with consistent KravTiltak icons)
  prioritet: (row, field, context) => {
    const prioritetValue = row[field.name];
    if (!prioritetValue) {
      const displayValue = getPriorityLabel(prioritetValue);
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    // Use centralized priority configuration
    const config = getPriorityLevel(prioritetValue);

    return context.format === "REACT" ? (
      <span className="inline-flex items-center gap-1.5">
        <span style={{ color: config.color }} className={config.iconRotation}>
          <Triangle size={14} />
        </span>
        <span className="text-slate-900">{config.label}</span>
      </span>
    ) : config.label;
  },

  // Fagomrade relationships (generic fallback)
  fagomradeId: (row, field, context) => {
    if (row.fagomrade && row.fagomrade.tittel) {
      const displayValue = row.fagomrade.tittel;
      if (context.format === "REACT" && row.fagomrade.icon) {
        return <IconWithText iconName={row.fagomrade.icon} text={displayValue} iconColor={row.fagomrade.color} />;
      }
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `Fagområde ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "Ingen fagområde";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Kravreferansetype relationships (generic fallback)
  kravreferansetypeId: (row, field, context) => {
    // Check both camelCase (from backend JSON) and lowercase field names
    const kravreferansetype = row.kravreferanseType || row.kravreferansetype;

    if (kravreferansetype && (kravreferansetype.navn || kravreferansetype.tittel)) {
      const displayValue = kravreferansetype.navn || kravreferansetype.tittel;

      // Only use IconWithText if we actually have an icon
      if (context.format === "REACT" && kravreferansetype.icon) {
        return <IconWithText iconName={kravreferansetype.icon} text={displayValue} iconColor={kravreferansetype.color} />;
      }
      // Return plain text/span for cases without icon
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else if (row[field.name]) {
      const displayValue = `Kravreferansetype ID: ${row[field.name]}`;
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } else {
      const displayValue = "Ingen kravreferansetype";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },
};
