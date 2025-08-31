// Model-specific display value handlers and overrides
// Only include truly unique customizations here - common patterns should use entityDisplayTypes and basicDisplayTypes
import React, { useState } from "react";
import { Badge } from "../../ui/primitives/badge";
import { Button } from "../../ui/primitives/button";
import {
  EnhancedParentDisplay,
  EnhancedRelationshipListDisplay,
  getParentDisplayString,
  getRelationshipDisplayString,
} from "./shared/RelationshipDisplayComponents.jsx";

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
          tabIndex={-1}
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
        tabIndex={-1}
        className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setExpanded(false)}
      >
        Skjul
      </Button>
    </div>
  );
};



// Enum translations for krav status
const kravStatusTranslations = {
  draft: "Kladd",
  baseline: "Gjeldende versjon",
  changed: "Endret",
  deprecated: "Utgår",
};

export const MODEL_SPECIFIC_DISPLAY = {
  // Only truly unique model-specific customizations

  enheter: {
    fieldNames: {
      // Hierarchical display with level indentation (unique to enheter)
      navn: (row, field, context) => {
        const value = row[field.name];
        if (!value) {
          return context.format === "REACT" ? <span>N/A</span> : "N/A";
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

  krav: {
    fieldNames: {
      // Enum translation for kravStatus (unique business logic)
      kravStatus: (row, field, context) => {
        const value = row[field.name];
        const displayValue = value && kravStatusTranslations[value] ? kravStatusTranslations[value] : value || "N/A";
        return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
      },

      // Parent krav relationship with enhanced display
      parentId: (row, field, context) => {
        if (context.format === "REACT") {
          return <EnhancedParentDisplay parent={row.parent} entityType="krav" emptyText="Ingen overordnet krav" />;
        }
        return getParentDisplayString(row.parent, "krav", row[field.name], "Ingen overordnet krav");
      },

      // Multi-select relationships with special formatting (unique to krav)
      kravpakker: (row, field, context) => {
        if (context.format === "REACT") {
          return <InlineMultiSelect items={row.kravpakker} emptyText="Ingen kravpakker" fieldName="tittel" />;
        }
        if (row.kravpakker && row.kravpakker.length > 0) {
          return row.kravpakker.map((k) => k.tittel || k.navn).join(", ");
        }
        return "Ingen kravpakker";
      },

      lover: (row, field, context) => {
        if (context.format === "REACT") {
          return <InlineMultiSelect items={row.lover} emptyText="Ingen lover" fieldName="tittel" />;
        }
        if (row.lover && row.lover.length > 0) {
          return row.lover.map((l) => l.tittel || l.navn).join(", ");
        }
        return "Ingen lover";
      },
    },
  },

  files: {
    fieldNames: {
      // File access with fresh signed URLs (unique to files)
      digitalOceanUrl: (row, field, context) => {
        if (context.format === "REACT") {
          return (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={async () => {
                try {
                  const { getFileSignedUrl } = await import("../../../api/endpoints/models/files");
                  const response = await getFileSignedUrl(row.id);
                  window.open(response.data.url, "_blank");
                } catch (error) {
                  console.error("Error getting signed URL:", error);
                  alert("Kunne ikke åpne filen");
                }
              }}
            >
              Åpne fil
            </Button>
          );
        }
        return "Åpne fil";
      },

      fileName: (row, field, context) => {
        const displayValue = row[field.name] || "Ukjent fil";
        if (context.format === "REACT") {
          return (
            <div className="flex items-center gap-2">
              <span>{displayValue}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={async () => {
                  try {
                    const { getFileSignedUrl } = await import("../../../api/endpoints/models/files");
                    const response = await getFileSignedUrl(row.id);
                    window.open(response.data.url, "_blank");
                  } catch (error) {
                    console.error("Error getting signed URL:", error);
                    alert("Kunne ikke åpne filen");
                  }
                }}
              >
                Åpne
              </Button>
            </div>
          );
        }
        return displayValue;
      },
    },
  },

  tiltak: {
    fieldNames: {
      // Krav multiselect relationship with detailed display
      krav: (row, field, context) => {
        if (context.format === "REACT") {
          return <EnhancedRelationshipListDisplay items={row.krav} entityType="krav" emptyText="Ingen krav" />;
        }
        return getRelationshipDisplayString(row.krav, "krav", "Ingen krav");
      },

      // Parent tiltak relationship with enhanced display
      parentId: (row, field, context) => {
        if (context.format === "REACT") {
          return <EnhancedParentDisplay parent={row.parent} entityType="tiltak" emptyText="Ingen overordnet tiltak" />;
        }
        return getParentDisplayString(row.parent, "tiltak", row[field.name], "Ingen overordnet tiltak");
      },
    },
  },

  prosjektTiltak: {
    fieldNames: {
      // Regular krav multiselect relationship with detailed display
      krav: (row, field, context) => {
        console.log('prosjektTiltak krav handler called', { row, field, context });
        if (context.format === "REACT") {
          return <EnhancedRelationshipListDisplay items={row.krav} entityType="krav" emptyText="Ingen krav" />;
        }
        return getRelationshipDisplayString(row.krav, "krav", "Ingen krav");
      },

      // ProsjektKrav multiselect relationship with detailed display
      prosjektKrav: (row, field, context) => {
        console.log('prosjektTiltak prosjektKrav handler called', { row, field, context });
        if (context.format === "REACT") {
          return <EnhancedRelationshipListDisplay items={row.prosjektKrav} entityType="prosjektKrav" emptyText="Ingen prosjektkrav" />;
        }
        return getRelationshipDisplayString(row.prosjektKrav, "prosjektKrav", "Ingen prosjektkrav");
      },

      // Parent prosjektTiltak relationship with enhanced display
      parentId: (row, field, context) => {
        console.log('prosjektTiltak parentId handler called', { row, field, context });
        if (context.format === "REACT") {
          return <EnhancedParentDisplay parent={row.parent} entityType="prosjektTiltak" emptyText="Ingen overordnet prosjekttiltak" />;
        }
        return getParentDisplayString(row.parent, "prosjektTiltak", row[field.name], "Ingen overordnet prosjekttiltak");
      },
    },
  },

};
