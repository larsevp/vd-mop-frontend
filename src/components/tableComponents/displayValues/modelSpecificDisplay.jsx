// Model-specific display value handlers and overrides
import React, { useState } from "react";
import { IconWithText } from "../../ui/DynamicIcon";
import { Badge } from "../../ui/primitives/badge";
import { Button } from "../../ui/primitives/button";

// Inline multi-select display with expand functionality
const InlineMultiSelect = ({ items, emptyText = "None selected", fieldName = "tittel" }) => {
  const [expanded, setExpanded] = useState(false);

  if (!items || !Array.isArray(items) || items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>;
  }

  if (items.length === 1) {
    return (
      <Badge variant="outline" className="text-xs px-2 py-1">
        {items[0][fieldName] || items[0].tittel || items[0].navn}
      </Badge>
    );
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs px-2 py-1">
          {items[0][fieldName] || items[0].tittel || items[0].navn}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(true)}
        >
          +{items.length - 1} fler
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <Badge key={item.id || index} variant="outline" className="text-xs px-2 py-1">
            {item[fieldName] || item.tittel || item.navn}
          </Badge>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(false)}
      >
        Skjul
      </Button>
    </div>
  );
};

// Enum translations
const kravStatusTranslations = {
  draft: "Kladd",
  baseline: "Gjeldende versjon",
  changed: "Endret",
  deprecated: "Utgår",
};

export const MODEL_SPECIFIC_DISPLAY = {
  // Model-specific field name overrides
  enheter: {
    fieldNames: {
      // Special handling for hierarchical display with level indentation
      navn: (row, field, context) => {
        const value = row[field.name];
        if (!value) {
          const displayValue = "N/A";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }

        // Handle hierarchical indentation for LIST context
        if (context.source === "LIST" && row.hasOwnProperty("level")) {
          const level = row.level !== undefined && row.level !== null ? Number(row.level) || 0 : 0;
          const indentedValue = "-".repeat(1 * level) + " " + value;
          return context.format === "REACT" ? <span>{indentedValue}</span> : indentedValue;
        }

        return context.format === "REACT" ? <span>{value}</span> : value;
      },
    },
  },

  // Krav model specific handling
  krav: {
    fieldNames: {
      // Special enum handling for kravStatus
      kravStatus: (row, field, context) => {
        const value = row[field.name];
        if (value && kravStatusTranslations[value]) {
          const displayValue = kravStatusTranslations[value];
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else if (value) {
          const displayValue = value; // Fallback to raw value
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else {
          const displayValue = "Ingen status";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }
      },

      // Kravreferansetype relationships for krav model
      kravreferansetypeId: (row, field, context) => {
        if (row.kravreferansetype && (row.kravreferansetype.navn || row.kravreferansetype.tittel)) {
          const displayValue = row.kravreferansetype.navn || row.kravreferansetype.tittel;
          if (context.format === "REACT" && row.kravreferansetype.icon) {
            return <IconWithText iconName={row.kravreferansetype.icon} text={displayValue} iconColor={row.kravreferansetype.color} />;
          }
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else if (row.kravreferanseType && (row.kravreferanseType.navn || row.kravreferanseType.tittel)) {
          // Try alternative naming convention
          const displayValue = row.kravreferanseType.navn || row.kravreferanseType.tittel;
          if (context.format === "REACT" && row.kravreferanseType.icon) {
            return <IconWithText iconName={row.kravreferanseType.icon} text={displayValue} iconColor={row.kravreferanseType.color} />;
          }
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else if (row[field.name]) {
          const displayValue = `Kravreferansetype ID: ${row[field.name]}`;
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else {
          const displayValue = "Ingen kravreferansetype";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }
      },

      // Emne relationships for krav model
      emneId: (row, field, context) => {
        //console.log(row.emne);
        if (row.emne && row.emne.tittel) {
          const displayValue = row.emne.tittel;
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

      // Status relationships for krav model
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

      // Vurdering relationships for krav model
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

      // Parent relationships for krav model (hierarchical)
      parentId: (row, field, context) => {
        if (row.parent && row.parent.tittel) {
          // Truncate parent krav title to 15 characters for krav model
          const fullTitle = row.parent.tittel;
          const truncatedTitle = fullTitle.length > 15 ? fullTitle.substring(0, 15) + "..." : fullTitle;
          const displayValue = truncatedTitle;

          if (context.format === "REACT" && row.parent.icon) {
            return <IconWithText iconName={row.parent.icon} text={displayValue} iconColor={row.parent.color} />;
          }
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else if (row[field.name]) {
          const displayValue = `Parent ID: ${row[field.name]}`;
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else {
          const displayValue = "Ingen parent";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }
      },

      // Enhet relationships for krav model
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

      // User relationships for krav model
      createdBy: (row, field, context) => {
        if (row.creator && row.creator.navn) {
          const displayValue = row.creator.navn;
          if (context.format === "REACT" && row.creator.icon) {
            return <IconWithText iconName={row.creator.icon} text={displayValue} iconColor={row.creator.color} />;
          }
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
          if (context.format === "REACT" && row.updater.icon) {
            return <IconWithText iconName={row.updater.icon} text={displayValue} iconColor={row.updater.color} />;
          }
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else if (row[field.name]) {
          const displayValue = `User ID: ${row[field.name]}`;
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        } else {
          const displayValue = "Ingen oppdateringer";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }
      },

      // Many-to-many relationships for krav model
      lover: (row, field, context) => {
        if (context.format === "REACT") {
          return <InlineMultiSelect items={row.lover} emptyText="-" fieldName="tittel" />;
        } else {
          // For non-React contexts (exports, etc.)
          if (row.lover && Array.isArray(row.lover) && row.lover.length > 0) {
            return row.lover.map((lov) => lov.tittel).join(", ");
          }
          return "-";
        }
      },

      kravpakker: (row, field, context) => {
        if (context.format === "REACT") {
          return <InlineMultiSelect items={row.kravpakker} emptyText="-" fieldName="tittel" />;
        } else {
          // For non-React contexts (exports, etc.)
          if (row.kravpakker && Array.isArray(row.kravpakker) && row.kravpakker.length > 0) {
            return row.kravpakker.map((pakke) => pakke.tittel).join(", ");
          }
          return "-";
        }
      },
    },

    // Field type overrides can be added here if needed
    fieldTypes: {
      // Example: If we want special handling for all enum types in krav model
      // enum: (row, field, context) => { ... }
    },
  },

  // Add other model-specific configurations here
  prosjekt: {
    fieldNames: {
      // Enhet relationships for prosjekt model
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

      // User relationships for prosjekt model
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
    },
  },

  status: {
    // Example: Enhanced status display with better icon handling
    fieldNames: {
      navn: (row, field, context) => {
        const value = row[field.name];
        if (!value) {
          const displayValue = "N/A";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }

        // Enhanced status display with icon
        if (context.format === "REACT" && row.icon) {
          return <IconWithText iconName={row.icon} text={value} iconColor={row.color} />;
        }

        return context.format === "REACT" ? <span>{value}</span> : value;
      },
    },
  },

  vurdering: {
    // Example: Special handling for vurdering tittel
    fieldNames: {
      tittel: (row, field, context) => {
        const value = row[field.name];
        if (!value) {
          const displayValue = "N/A";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }

        // Enhanced vurdering display with icon
        if (context.format === "REACT" && row.icon) {
          return <IconWithText iconName={row.icon} text={value} iconColor={row.color} />;
        }

        return context.format === "REACT" ? <span>{value}</span> : value;
      },

      navn: (row, field, context) => {
        const value = row[field.name];
        if (!value) {
          const displayValue = "N/A";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }

        // Enhanced vurdering display with icon
        if (context.format === "REACT" && row.icon) {
          return <IconWithText iconName={row.icon} text={value} iconColor={row.color} />;
        }

        return context.format === "REACT" ? <span>{value}</span> : value;
      },
    },
  },

  emne: {
    fieldNames: {
      // Enhanced emne display with icon
      tittel: (row, field, context) => {
        const value = row[field.name];
        if (!value) {
          const displayValue = "N/A";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }

        // Enhanced emne display with icon
        if (context.format === "REACT" && row.icon) {
          return <IconWithText iconName={row.icon} text={value} iconColor={row.color} />;
        }

        return context.format === "REACT" ? <span>{value}</span> : value;
      },

      // Standard foreign key relationships for emne
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
    },
  },

  kravreferansetype: {
    fieldNames: {
      tittel: (row, field, context) => {
        const value = row[field.name];
        if (!value) {
          const displayValue = "N/A";
          return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
        }

        // Enhanced kravreferansetype display with icon
        if (context.format === "REACT" && row.icon) {
          return <IconWithText iconName={row.icon} text={value} iconColor={row.color} />;
        }

        return context.format === "REACT" ? <span>{value}</span> : value;
      },

      // Standard foreign key relationships for kravreferansetype
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
    },
  },
};
