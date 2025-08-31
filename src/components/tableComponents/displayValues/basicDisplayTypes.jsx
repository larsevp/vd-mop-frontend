// Basic display value handlers for common field types
import React from "react";
import { booleanToJaNei } from "../../../utils/booleanParser";
import { IconWithText } from "../../ui/DynamicIcon";
import { ExpandableRichText } from "./ExpandableRichText";

export const BASIC_DISPLAY_TYPES = {
  // Boolean fields

  bool: (row, field, context) => {
    const value = row[field.name];
    const displayValue = booleanToJaNei(value, "Ikke angitt");

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // Text fields
  text: (row, field, context) => {
    //console.log(field);
    const value = row[field.name];
    let displayValue = value !== null && value !== undefined ? value : "N/A";

    // Handle objects by trying to extract a meaningful display value
    if (typeof displayValue === "object" && displayValue !== null) {
      // Try common name fields for objects
      displayValue =
        displayValue.tittel ||
        displayValue.navn ||
        displayValue.name ||
        displayValue.kravUID ||
        displayValue.tiltakUID ||
        displayValue.id ||
        JSON.stringify(displayValue);
    }

    const { truncate } = field;

    if (truncate && typeof truncate === "number" && typeof displayValue === "string" && displayValue.length > truncate) {
      displayValue = `${displayValue.substring(0, truncate)}...`;
    }

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // String fields (alias for text)
  string: (row, field, context) => {
    const value = row[field.name];
    const displayValue = value !== null && value !== undefined ? value : "N/A";

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // Number fields
  number: (row, field, context) => {
    const value = row[field.name];
    const displayValue = value !== null && value !== undefined ? value.toString() : "N/A";

    if (context.format === "REACT") {
      return <span>{displayValue}</span>;
    }
    return displayValue;
  },

  // Date fields
  date: (row, field, context) => {
    const value = row[field.name];
    if (!value) {
      const displayValue = "N/A";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    try {
      const displayValue = new Date(value).toLocaleDateString("nb-NO");
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } catch (error) {
      const displayValue = value.toString();
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Datetime fields
  datetime: (row, field, context) => {
    const value = row[field.name];
    if (!value) {
      const displayValue = "N/A";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    try {
      const displayValue = new Date(value).toLocaleString("nb-NO");
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    } catch (error) {
      const displayValue = value.toString();
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }
  },

  // Rich text fields
  richtext: (row, field, context) => {
    const value = row[field.name];
    if (!value) {
      const displayValue = "N/A";
      return context.format === "REACT" ? <span>{displayValue}</span> : displayValue;
    }

    if (context.format === "REACT") {
      // Use ExpandableRichText for React display, but don't collapse in detail views
      const maxLength = context.source === "DETAIL" ? Infinity : 100;
      return <ExpandableRichText content={value} maxLength={maxLength} />;
    }

    // For string format, strip HTML tags and return plain text
    const plainText = value.replace(/<[^>]*>/g, "").trim();
    return plainText || "N/A";
  },

  // Basic rich text fields (alias for richtext)
  basicrichtext: (row, field, context) => {
    return BASIC_DISPLAY_TYPES.richtext(row, field, context);
  },

  // File upload field display
  fileupload: (row, field, context) => {
    const files = row[field.name] || [];
    const hasFiles = Array.isArray(files) && files.length > 0;
    
    if (context.format === "REACT") {
      if (hasFiles) {
        return (
          <div className="text-sm">
            <div className="text-gray-700 font-medium mb-1">{files.length} fil{files.length !== 1 ? 'er' : ''} lastet opp:</div>
            <div className="space-y-1">
              {files.map((file, index) => (
                <div key={index} className="text-blue-600 hover:text-blue-800 cursor-pointer">
                  {file.originalName || file.filename || `Fil ${index + 1}`}
                </div>
              ))}
            </div>
          </div>
        );
      }
      return <span className="text-sm text-gray-500">Ingen filer lastet opp. Trykk på rediger for å laste opp filer.</span>;
    }
    
    return hasFiles ? `${files.length} fil${files.length !== 1 ? 'er' : ''}` : "Ingen filer";
  },

  // Multiselect field display - generic handler for all multiselect relationships
  multiselect: (row, field, context) => {
    const items = row[field.name] || [];
    
    if (!Array.isArray(items) || items.length === 0) {
      const emptyText = "Ingen valgte elementer";
      return context.format === "REACT" ? <span className="text-sm text-gray-500">{emptyText}</span> : emptyText;
    }

    if (context.format === "REACT") {
      return (
        <div className="text-sm space-y-1">
          {items.map((item, index) => {
            // Try to get a meaningful display value from the object
            let displayText = '';
            if (typeof item === 'object' && item !== null) {
              const uid = item.kravUID || item.tiltakUID || item.prosjektKravUID || item.prosjektTiltakUID;
              const title = item.tittel || item.navn || item.name;
              displayText = uid && title ? `${uid} - ${title}` : (title || uid || `ID: ${item.id}`);
            } else {
              displayText = `ID: ${item}`;
            }
            
            return (
              <div key={index} className="text-blue-600">
                {displayText}
              </div>
            );
          })}
        </div>
      );
    }

    // For string format, return comma-separated list
    return items.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        const uid = item.kravUID || item.tiltakUID || item.prosjektKravUID || item.prosjektTiltakUID;
        const title = item.tittel || item.navn || item.name;
        return uid && title ? `${uid} - ${title}` : (title || uid || `ID: ${item.id}`);
      }
      return `ID: ${item}`;
    }).join(', ');
  },
};
