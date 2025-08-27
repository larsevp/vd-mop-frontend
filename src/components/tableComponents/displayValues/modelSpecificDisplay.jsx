// Model-specific display value handlers and overrides
// Only include truly unique customizations here - common patterns should use entityDisplayTypes and basicDisplayTypes
import React, { useState } from "react";
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

// Specialized component for displaying Krav relationships with UID, title, and description
const KravListDisplay = ({ items, emptyText = "Ingen krav" }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>;
  }

  return (
    <div className="space-y-2">
      {items.map((krav, index) => (
        <div key={krav.id || index} className="border rounded-lg p-3 bg-gray-50">
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="text-xs font-mono shrink-0">
              {krav.kravUID}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 mb-1">{krav.tittel}</div>
              {krav.beskrivelseSnippet && <div className="text-xs text-gray-600 line-clamp-2">{krav.beskrivelseSnippet}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Reusable component for displaying parent relationships with UID and title
const ParentEntityDisplay = ({ parent, entityType, emptyText }) => {
  if (!parent) {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>;
  }

  // Get the UID field name based on entity type
  const uidField = entityType === "tiltak" ? "tiltakUID" : entityType === "krav" ? "kravUID" : "id";
  const uid = parent[uidField];
  const title = parent.tittel || parent.navn || parent.name;

  if (uid && title) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs font-mono shrink-0">
          {uid}
        </Badge>
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
    );
  } else if (title) {
    return <span className="text-sm font-medium text-gray-900">{title}</span>;
  } else if (uid) {
    return (
      <Badge variant="outline" className="text-xs font-mono">
        {uid}
      </Badge>
    );
  } else {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>;
  }
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
          return <ParentEntityDisplay parent={row.parent} entityType="krav" emptyText="Ingen overordnet krav" />;
        }

        // For string format
        if (row.parent) {
          const uid = row.parent.kravUID;
          const title = row.parent.tittel;
          if (uid && title) {
            return `${uid} - ${title}`;
          } else if (title) {
            return title;
          } else if (uid) {
            return uid;
          }
        } else if (row[field.name]) {
          return `Krav ID: ${row[field.name]}`;
        }

        return "Ingen overordnet krav";
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
          return <KravListDisplay items={row.krav} emptyText="Ingen krav" />;
        }

        // For string format, return comma-separated list with UID and title
        if (!row.krav || !Array.isArray(row.krav) || row.krav.length === 0) {
          return "Ingen krav";
        }

        return row.krav.map((krav) => `${krav.kravUID} - ${krav.tittel}`).join(", ");
      },

      // Parent tiltak relationship with enhanced display (matching krav style)
      parentId: (row, field, context) => {
        if (context.format === "REACT") {
          if (!row.parent) {
            return <span className="text-muted-foreground text-sm">Ingen overordnet tiltak</span>;
          }

          const parent = row.parent;
          return (
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="text-xs font-mono shrink-0">
                  {parent.tiltakUID}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 mb-1">{parent.tittel}</div>
                  {parent.beskrivelseSnippet && <div className="text-xs text-gray-600 line-clamp-2">{parent.beskrivelseSnippet}</div>}
                </div>
              </div>
            </div>
          );
        }

        // For string format
        if (row.parent) {
          const uid = row.parent.tiltakUID;
          const title = row.parent.tittel;
          if (uid && title) {
            return `${uid} - ${title}`;
          } else if (title) {
            return title;
          } else if (uid) {
            return uid;
          }
        } else if (row[field.name]) {
          return `Tiltak ID: ${row[field.name]}`;
        }

        return "Ingen overordnet tiltak";
      },
    },
  },
};
