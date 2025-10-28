import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TiptapDisplay } from "../../ui/editor/TiptapDisplay";
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

export const ExpandableRichText = ({
  content,
  maxLength = 100,
  className = "",
  snippet = null, // Optional snippet text for collapsed state
  collapsible = false // If true, always start collapsed with expand button
}) => {
  const [isExpanded, setIsExpanded] = useState(false);


  // Handle empty, whitespace-only, or minimal content
  if (!content ||
      content === "" ||
      content === "<p></p>" ||
      content === "<div></div>" ||
      /^<p[^>]*>\s*<\/p>$/.test(content) || // Empty paragraph with classes
      (typeof content === 'string' && content.replace(/<[^>]*>/g, '').trim() === "")) {
    return <span className="text-muted-foreground">Ingen beskrivelse</span>;
  }

  // Check if content contains tables, images, or complex formatting that needs Tiptap rendering
  const needsTiptapDisplay = useMemo(() => {
    if (typeof content === 'object' && content !== null) return true;
    if (typeof content === 'string') {
      return content.includes('<table') || content.includes('<img') || content.includes('class="');
    }
    return false;
  }, [content]);

  // Add global styles for Tiptap content
  React.useEffect(() => {
    const styleId = 'tiptap-display-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .tiptap-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
          color: hsl(var(--foreground));
        }
        .tiptap-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          margin-top: 1.25rem;
          color: hsl(var(--foreground));
        }
        .tiptap-content p {
          margin-bottom: 0.75rem;
          color: hsl(var(--foreground));
          line-height: 1.6;
        }
        .tiptap-content strong {
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .tiptap-content em {
          font-style: italic;
          color: hsl(var(--foreground));
        }
        .tiptap-content ul {
          list-style-type: disc;
          margin-left: 1rem;
          margin-bottom: 0.75rem;
        }
        .tiptap-content ol {
          list-style-type: decimal;
          margin-left: 1rem;
          margin-bottom: 0.75rem;
        }
        .tiptap-content li {
          margin-bottom: 0.25rem;
          color: hsl(var(--foreground));
        }
        .tiptap-content table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
          font-size: 0.875rem;
        }
        .tiptap-content table td,
        .tiptap-content table th {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
          text-align: left;
          vertical-align: top;
        }
        .tiptap-content table th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  // Convert TipTap JSON to HTML if needed (with stable dependency)
  const htmlContent = useMemo(() => {
    try {
      // If content is an object (TipTap JSON), convert to HTML
      if (typeof content === 'object' && content !== null && content.type) {
        const html = generateHTML(content, extensions);
        // Remove xmlns attributes that can cause styling issues
        return html.replace(/\s*xmlns="[^"]*"/g, '');
      }
      // If content is already a string, use as-is but clean xmlns
      const stringContent = typeof content === 'string' ? content : String(content || '');
      return stringContent.replace(/\s*xmlns="[^"]*"/g, '');
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

  // If collapsible is explicitly true, always show expand/collapse button
  // Otherwise, only show if content needs truncation
  const shouldShowToggle = collapsible || needsTruncation;

  if (!shouldShowToggle) {
    if (needsTiptapDisplay) {
      return (
        <TiptapDisplay
          content={content}
          className={className}
          basic={false}
        />
      );
    }
    return (
      <div
        className={cn("tiptap-content", className)}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }
  
  return (
    <div className={cn(className)}>
      {/* Content area */}
      <div className="text-foreground">
        {isExpanded ? (
          // Expanded: Show full content
          <>
            {needsTiptapDisplay ? (
              <TiptapDisplay
                key={`expanded-${isExpanded}`}
                content={content}
                className=""
                basic={false}
              />
            ) : (
              <div
                className="tiptap-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            {/* Collapse button - placed after content */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="inline-flex items-center gap-1 mt-2 px-2 py-1 -mx-2 -my-1 rounded text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
            >
              <ChevronUp size={12} />
              Vis mindre
            </button>
          </>
        ) : (
          // Collapsed: Show snippet with trailing dots and inline expand button
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-slate-700">
              {snippet || `${plainText.substring(0, maxLength)}`}
              {!snippet?.endsWith('...') && !snippet?.endsWith('.') && <span className="text-slate-400">...</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all whitespace-nowrap"
            >
              <ChevronDown size={12} />
              vis mer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};