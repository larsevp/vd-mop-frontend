import React, { useCallback, useState, useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { useTiptapEditor } from "./hooks/useTiptapEditor";
import { TiptapToolbar } from "./components/TiptapToolbar";
import { Toast } from "./components/Toast";
import { TableInlineControls } from "./components/TableInlineControls";
import ScrollPreventWrapper from "@/components/EntityWorkspace/interface/components/ScrollPreventWrapper";

export const TiptapEditor = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
  error = false,
  disabled = false,
  className = "",
  uploadUrl = null, // Can be { relatedModelType: 'Krav', relatedModelId: 123 } for context
  basic = false, // If true, only shows B, I, U and H1/H2 buttons - no images, tables, links
  availableEntities = [], // List of entities for @-mentions
}) => {
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [isFocused, setIsFocused] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

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

  // Store available entities in editor storage for mention extension
  useEffect(() => {
    if (editor && availableEntities) {
      if (!editor.storage.entityMention) {
        editor.storage.entityMention = {};
      }
      editor.storage.entityMention.entities = availableEntities;
    }
  }, [editor, availableEntities]);

  // Handle link addition - open modal or exit link mode if button is active
  const handleAddLink = useCallback(() => {
    if (!editor) return;

    // If cursor is in a link (button is blue), just insert a space to exit link mode
    if (editor.isActive('link')) {
      editor.chain().focus().insertContent(' ').run();
      return;
    }

    // Check if there's selected text
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '');

    // Pre-fill with selected text if any
    setLinkText(selectedText || '');
    setLinkUrl('');
    setLinkDialogOpen(true);
  }, [editor]);

  // Insert the link when modal is submitted
  const handleInsertLink = useCallback(() => {
    if (!editor || !linkText || !linkUrl) return;

    // Ensure URL starts with protocol
    const fullUrl = linkUrl.startsWith("http://") || linkUrl.startsWith("https://") ? linkUrl : `https://${linkUrl}`;

    // Check if there's selected text
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '');

    // If there was selected text, replace it with the link
    if (selectedText) {
      // Simply set the link on the selected text
      editor.chain().focus().setLink({ href: fullUrl }).run();
      // Then move cursor after the link and insert a space
      editor.chain().focus().setTextSelection(to).insertContent(' ').run();
    } else {
      // Insert new text with link, then add a space after it WITHOUT the link mark
      editor.chain()
        .focus()
        .insertContent([
          {
            type: 'text',
            text: linkText,
            marks: [{ type: 'link', attrs: { href: fullUrl } }]
          },
          {
            type: 'text',
            text: ' '
          }
        ])
        .run();
    }

    // Close modal and reset
    setLinkDialogOpen(false);
    setLinkText('');
    setLinkUrl('');
  }, [editor, linkText, linkUrl]);

  // Sync external value changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  // Handle focus/blur events with delay to prevent toolbar hiding when clicking toolbar buttons
  React.useEffect(() => {
    if (editor) {
      let blurTimeout;
      
      const handleFocus = () => {
        if (blurTimeout) {
          clearTimeout(blurTimeout);
          blurTimeout = null;
        }
        setIsFocused(true);
      };
      
      const handleBlur = (event) => {
        // Delay hiding the toolbar to allow toolbar button clicks to be processed
        blurTimeout = setTimeout(() => {
          // Check if focus moved to a toolbar element
          const activeElement = document.activeElement;
          const toolbarElement = activeElement?.closest('.tiptap-toolbar');
          
          if (!toolbarElement) {
            setIsFocused(false);
          }
        }, 150); // Small delay to allow toolbar interactions
      };

      editor.on('focus', handleFocus);
      editor.on('blur', handleBlur);

      return () => {
        if (blurTimeout) {
          clearTimeout(blurTimeout);
        }
        editor.off('focus', handleFocus);
        editor.off('blur', handleBlur);
      };
    }
  }, [editor]);

  return (
    <div
      className={cn(
        "border rounded-md transition-colors flex flex-col",
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
          min-height: 100px;
          padding: 12px 16px;
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

      {/* Always show toolbar in edit mode, not just when focused - Sticky accounting for container padding */}
      <ScrollPreventWrapper className="tiptap-toolbar sticky z-20 bg-white flex-shrink-0" style={{ top: '-2rem' }}>
        <TiptapToolbar editor={editor} onAddLink={handleAddLink} uploadUrl={uploadUrl} onShowToast={showToast} basic={basic} />
      </ScrollPreventWrapper>
      <div
        className="min-h-[120px] overflow-y-visible cursor-text flex-1"
        onClick={() => {
          // Focus the editor when clicking anywhere in the content area
          if (editor && !disabled) {
            editor.chain().focus().run();
          }
        }}
      >
        {/* Safari-safe editor content rendering */}
        {editor && editor.view ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="p-4 text-muted-foreground">Loading editor...</div>
        )}
        {editor && editor.view && editor.isActive("table") && <TableInlineControls editor={editor} />}
      </div>
      {editor && editor.isActive("table") && (
        <div className="px-3 py-1.5 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          Table editing mode • Click "Tabell ▼" for options • Ctrl+Delete to delete table
        </div>
      )}
      
      {isFocused && !editor?.isActive("table") && (
        <div className="px-3 py-1.5 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          Press Esc to exit editor and continue with Tab navigation
        </div>
      )}

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      {/* Link Dialog Modal */}
      {linkDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Sett inn lenke</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lenketekst
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="F.eks: Klikk her"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && linkText && linkUrl) {
                      handleInsertLink();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setLinkDialogOpen(false);
                  setLinkText('');
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleInsertLink}
                disabled={!linkText || !linkUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Sett inn lenke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
