import React from "react";
import { EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { useTiptapEditor } from "./hooks/useTiptapEditor";

// Display-specific styles without padding
const getDisplayEditorStyles = () => {
  return cn(
    "focus:outline-none text-foreground leading-relaxed",
    "prose prose-sm max-w-none",
    "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:text-foreground",
    "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:text-foreground",
    "[&_p]:text-foreground [&_p]:leading-relaxed [&_p]:mb-0 [&_p]:mt-0",
    "[&_p:not(:last-child)]:mb-3",
    // Remove paragraph margins inside table cells to prevent visual "blank" rows
    "[&_td>p]:m-0 [&_th>p]:m-0 [&_td>p:last-child]:mb-0 [&_th>p:last-child]:mb-0",
    // Top-align table cell content for consistency
    "[&_td]:align-top [&_th]:align-top",
    "[&_strong]:text-foreground [&_strong]:font-semibold",
    "[&_em]:text-foreground",
    "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:mt-0 [&_ol]:mt-0",
    "[&_li]:text-foreground [&_li]:mb-1",
    "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
  );
};

/**
 * Read-only Tiptap display component for consistent rendering
 * Uses the same editor configuration but disabled for display only
 */
export const TiptapDisplay = ({ 
  content, 
  className = "",
  basic = false 
}) => {
  // Clean content to remove empty paragraphs and trailing newlines
  const cleanContent = React.useMemo(() => {
    if (!content) return "";
    
    if (typeof content === 'string') {
      // Remove trailing empty paragraphs and newlines (including ones with classes)
      const cleaned = content
        .replace(/<p[^>]*><\/p>\s*$/g, '') // Remove trailing empty paragraphs (with any attributes)
        .replace(/<p[^>]*>\s*<\/p>/g, '') // Remove any empty paragraphs (with any attributes)
        .replace(/<div[^>]*><\/div>/g, '') // Remove empty divs (with any attributes)
        .replace(/<div[^>]*>\s*<\/div>/g, '') // Remove empty divs with whitespace (with any attributes)
        .trim();
      return cleaned;
    }
    
    return content;
  }, [content]);

  // Use the same editor hook but make it non-editable without graying out
  const editor = useTiptapEditor({
    value: cleanContent,
    onChange: () => {}, // No-op since it's read-only
    placeholder: "",
    disabled: false, // Don't gray it out
    basic,
    onShowToast: () => {}, // No-op
    uploadUrl: null,
  });

  // Make editor non-editable after creation and override styles
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(false);
      // Override the editor styles to remove padding
      if (editor.view && editor.view.dom) {
        editor.view.dom.className = getDisplayEditorStyles();
      }
    }
  }, [editor]);

  // Check for empty or meaningless content after cleaning
  if (!cleanContent || 
      cleanContent === "" || 
      cleanContent === "<p></p>" || 
      cleanContent === "<div></div>" ||
      (typeof cleanContent === 'string' && cleanContent.replace(/<[^>]*>/g, '').trim() === "")) {
    return <span className="text-muted-foreground">Ingen innhold</span>;
  }

  return (
    <div className={cn("tiptap-display", className)}>
      {/* Use minimal inline styles for read-only display */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tiptap-display .ProseMirror {
          outline: none;
          border: none;
          padding: 0 !important;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          background: transparent;
          color: inherit;
          cursor: default;
        }
        .tiptap-display .ProseMirror:focus {
          outline: none;
        }
        .tiptap-display .ProseMirror * {
          cursor: default;
        }
        .tiptap-display .ProseMirror table {
          table-layout: auto;
          width: auto;
          min-width: 200px;
        }
      `,
        }}
      />
      <EditorContent editor={editor} />
    </div>
  );
};