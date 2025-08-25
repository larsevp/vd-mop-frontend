import React, { useCallback, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { useTiptapEditor } from "./hooks/useTiptapEditor";
import { TiptapToolbar } from "./components/TiptapToolbar";
import { Toast } from "./components/Toast";
import { TableInlineControls } from "./components/TableInlineControls";

export const TiptapEditor = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
  error = false,
  disabled = false,
  className = "",
  uploadUrl = null, // Can be { relatedModelType: 'Krav', relatedModelId: 123 } for context
  basic = false, // If true, only shows B, I, U and H1/H2 buttons - no images, tables, links
}) => {
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const showToast = useCallback((message, type = "info") => {
    setToast({ show: true, message, type });
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const editor = useTiptapEditor({
    value,
    onChange,
    placeholder,
    disabled,
    basic,
    onShowToast: showToast,
    uploadUrl,
  });

  // Handle link addition - defined after editor is created
  const handleAddLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter full URL (including http:// or https://):");
    if (url) {
      // Ensure URL starts with protocol
      const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: fullUrl }).run();
    }
  }, [editor]);

  // Sync external value changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden transition-colors",
        error ? "border-destructive" : "border-input",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "bg-muted cursor-not-allowed",
        className
      )}
    >
      {/* ProseMirror required CSS and image styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ProseMirror {
          white-space: pre-wrap;
          word-wrap: break-word;
          outline: none;
        }
        .ProseMirror img {
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .ProseMirror img:hover {
          box-shadow: 0 0 0 2px #3b82f6;
        }
        .ProseMirror .ProseMirror-selectednode img {
          box-shadow: 0 0 0 2px #3b82f6;
        }
        /* Make multi-cell selections clearly visible */
        .ProseMirror td.selectedCell,
        .ProseMirror th.selectedCell {
          position: relative;
        }
        .ProseMirror td.selectedCell::after,
        .ProseMirror th.selectedCell::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(59, 130, 246, 0.12); /* blue-500 @ 12% */
          outline: 2px solid rgba(59, 130, 246, 0.8);
          pointer-events: none;
        }
      `,
        }}
      />

      <TiptapToolbar editor={editor} onAddLink={handleAddLink} uploadUrl={uploadUrl} onShowToast={showToast} basic={basic} />
      <div className="min-h-[120px] max-h-[600px] overflow-y-auto">
        <EditorContent editor={editor} />
        {editor && editor.isActive("table") && <TableInlineControls editor={editor} />}
      </div>
      {editor && editor.isActive("table") && (
        <div className="px-3 py-1.5 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          Table editing mode • Click "Tabell ▼" for options • Ctrl+Delete to delete table
        </div>
      )}

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );
};
