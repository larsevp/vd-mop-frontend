import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { Heading } from "@tiptap/extension-heading";

// TipTap extensions for HTML generation (stable reference)
const extensions = [
  StarterKit.configure({
    // Disable the default link, underline, and heading to avoid conflicts
    link: false,
    underline: false,
    heading: false,
  }),
  Link,
  Image,
  Table,
  TableRow,
  TableHeader, 
  TableCell,
  Underline,
  Heading.configure({ levels: [1, 2, 3] }),
];

export const ExpandableRichText = ({ content, maxLength = 100, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!content) return <span className="text-muted-foreground">Ingen beskrivelse</span>;
  
  // Convert TipTap JSON to HTML if needed (with stable dependency)
  const htmlContent = useMemo(() => {
    try {
      // If content is an object (TipTap JSON), convert to HTML
      if (typeof content === 'object' && content !== null && content.type) {
        return generateHTML(content, extensions);
      }
      // If content is already a string, use as-is
      return typeof content === 'string' ? content : String(content || '');
    } catch (error) {
      console.warn('Failed to convert TipTap content to HTML:', error);
      // Fallback: try to stringify the content
      if (typeof content === 'object' && content !== null) {
        return JSON.stringify(content);
      }
      return typeof content === 'string' ? content : String(content || '');
    }
  }, [content]);
  
  // Strip HTML tags and get plain text for length calculation
  const plainText = htmlContent.replace(/<[^>]*>/g, '').trim();
  const needsTruncation = plainText.length > maxLength;
  
  if (!needsTruncation) {
    // Short content - show as plain text
    return (
      <span 
        className={cn("text-foreground", className)}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Truncated/Full content */}
      <div className="text-foreground">
        {isExpanded ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <span>
            {plainText.substring(0, maxLength)}...
          </span>
        )}
      </div>
      
      {/* Toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent row click events
          setIsExpanded(!isExpanded);
        }}
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {isExpanded ? (
          <>
            <ChevronUp size={12} />
            Vis mindre
          </>
        ) : (
          <>
            <ChevronDown size={12} />
            Vis mer
          </>
        )}
      </button>
    </div>
  );
};