import React, { useCallback, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Heading } from "@tiptap/extension-heading";
import { cn } from "@/lib/utils";
import ScrollableContainer from "../layout/scrollable-container";
import { ChevronDown, Plus, Minus, Trash2, Table as TableIcon, ImageIcon, AlertCircle, X } from "lucide-react";

const ToolbarButton = React.forwardRef(({ onClick, active, disabled, children, title, className }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "px-3 py-1.5 rounded text-sm font-medium transition-colors border",
      "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-foreground border-border",
      className
    )}
  >
    {children}
  </button>
));

const ToolbarSeparator = () => <div className="w-px h-6 bg-border mx-1" />;

const Toast = ({ message, type = "info", onClose, show }) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-2">
      <div
        className={cn(
          "rounded-lg border p-4 shadow-lg max-w-md",
          "bg-card text-card-foreground",
          type === "error" && "border-destructive/50 text-destructive",
          type === "warning" && "border-orange-200 bg-orange-50 text-orange-800"
        )}
      >
        <div className="flex items-start gap-3">
          {type === "error" && <AlertCircle size={18} className="text-destructive mt-0.5" />}
          {type === "warning" && <AlertCircle size={18} className="text-orange-600 mt-0.5" />}
          <div className="flex-1 text-sm">{message}</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const TableDropdown = ({
  editor,
  onAddTable,
  onDeleteTable,
  onAddRowBefore,
  onAddRowAfter,
  onDeleteRow,
  onAddColumnBefore,
  onAddColumnAfter,
  onDeleteColumn,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInTable, setIsInTable] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, right: "auto" });
  const buttonRef = useRef(null);

  // Calculate dropdown position using viewport coordinates
  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 160;
    const dropdownHeight = 240; // max height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position
    let top = buttonRect.bottom + 4; // 4px gap
    let left = buttonRect.right - dropdownWidth; // Right-align by default

    // Adjust horizontal position if it overflows
    if (left < 8) {
      // 8px margin from edge
      left = buttonRect.left; // Left-align instead
    }
    if (left + dropdownWidth > viewportWidth - 8) {
      left = viewportWidth - dropdownWidth - 8; // Keep within viewport
    }

    // Adjust vertical position if it overflows
    if (top + dropdownHeight > viewportHeight - 8) {
      top = buttonRect.top - dropdownHeight - 4; // Position above button
    }

    setPosition({ top, left, right: "auto" });
  }, []);

  // Update table state when editor selection changes
  React.useEffect(() => {
    if (!editor) return;

    const updateTableState = () => {
      const newIsInTable = editor.isActive("table");
      setIsInTable(newIsInTable);
      if (!newIsInTable) {
        setIsOpen(false); // Close dropdown when leaving table
      }
    };

    editor.on("selectionUpdate", updateTableState);
    updateTableState(); // Initial check

    return () => {
      editor.off("selectionUpdate", updateTableState);
    };
  }, [editor]);

  // Update position on scroll/resize
  React.useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      calculateDropdownPosition();
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, calculateDropdownPosition]);

  return (
    <div className="relative">
      <ToolbarButton
        ref={buttonRef}
        onClick={() => {
          if (isInTable) {
            calculateDropdownPosition();
            setIsOpen(!isOpen);
          } else {
            onAddTable();
          }
        }}
        title={isInTable ? "Table Options" : "Insert Table"}
        active={isInTable}
      >
        <div className="flex items-center gap-1">
          <TableIcon size={16} />
          <span>Tabell</span>
          <ChevronDown size={12} className={isInTable ? "opacity-100" : "opacity-0"} />
        </div>
      </ToolbarButton>

      {isOpen && isInTable && (
        <div
          className="fixed bg-white border border-border rounded-md shadow-lg z-10 w-[160px]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            right: position.right,
          }}
        >
          <ScrollableContainer maxHeight="240px" fadeColor="from-white" className="p-0">
            <div className="py-1">
              <button
                onClick={() => {
                  onAddRowBefore();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Row Above
              </button>
              <button
                onClick={() => {
                  onAddRowAfter();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Row Below
              </button>
              <button
                onClick={() => {
                  onDeleteRow();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 text-red-600 flex items-center gap-2"
              >
                <Minus size={14} />
                Delete Row
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  onAddColumnBefore();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Column Left
              </button>
              <button
                onClick={() => {
                  onAddColumnAfter();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              >
                <Plus size={14} />
                Add Column Right
              </button>
              <button
                onClick={() => {
                  onDeleteColumn();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 text-red-600 flex items-center gap-2"
              >
                <Minus size={14} />
                Delete Column
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  onDeleteTable();
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 text-red-600 font-medium flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete Table
              </button>
            </div>
          </ScrollableContainer>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

const TiptapToolbar = ({ editor, onAddLink, uploadUrl, onShowToast, basic = false }) => {
  if (!editor) return null;

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const deleteTable = useCallback(() => {
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    editor.chain().focus().addColumnBefore().run();
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.chain().focus().deleteColumn().run();
  }, [editor]);

  const addRowBefore = useCallback(() => {
    editor.chain().focus().addRowBefore().run();
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run();
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        if (uploadUrl) {
          // Future: Upload to backend
          const formData = new FormData();
          formData.append("file", file);
          fetch(uploadUrl, {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
              }
            })
            .catch((error) => {
              console.error("Upload failed:", error);
              onShowToast("Opplasting av bilde feilet", "error");
            });
        } else {
          // Temporary: Use local blob URL
          const url = URL.createObjectURL(file);
          editor.chain().focus().setImage({ src: url }).run();

          // Show warning about temporary storage
          setTimeout(() => {
            onShowToast("Merk: Bildet er midlertidig lagret og kan forsvinne. Backend for bildeopplasting kommer snart.", "warning");
          }, 100);
        }
      }
    };
    input.click();
  }, [editor, uploadUrl]);

  return (
    <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap">
      {/* Text Formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <u>U</u>
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Text Styles */}
      {!basic && (
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().setParagraph().run();
            // Also remove any active link
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            }
          }}
          active={!editor.isActive("heading")}
          title="Normal Text (removes links and headings)"
        >
          Normal
        </ToolbarButton>
      )}
      <ToolbarButton
        onClick={() => {
          if (editor.isActive("heading", { level: 1 })) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }
        }}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          if (editor.isActive("heading", { level: 2 })) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }
        }}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      {!basic && (
        <>
          <ToolbarSeparator />

          {/* Links & Tables */}
          <ToolbarButton onClick={onAddLink} active={editor.isActive("link")} title="Add Link (Ctrl+K)">
            Link
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="Last opp bilde">
            <div className="flex items-center gap-1">
              <ImageIcon size={16} />
              Bilde
            </div>
          </ToolbarButton>

          {/* Image resize controls when image is selected */}
          {editor && editor.isActive && editor.isActive("image") && (
            <>
              <ToolbarSeparator />
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().updateAttributes("image", { width: "250" }).run();
                }}
                title="Liten (250px)"
              >
                Liten
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().updateAttributes("image", { width: "500" }).run();
                }}
                title="Medium (500px)"
              >
                Medium
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().updateAttributes("image", { width: null }).run();
                }}
                title="Original størrelse"
              >
                Original
              </ToolbarButton>
            </>
          )}
          <TableDropdown
            editor={editor}
            onAddTable={addTable}
            onDeleteTable={deleteTable}
            onAddRowBefore={addRowBefore}
            onAddRowAfter={addRowAfter}
            onDeleteRow={deleteRow}
            onAddColumnBefore={addColumnBefore}
            onAddColumnAfter={addColumnAfter}
            onDeleteColumn={deleteColumn}
          />
        </>
      )}
    </div>
  );
};

export const TiptapEditor_bsbsb = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
  error = false,
  disabled = false,
  className = "",
  uploadUrl = null, // Future backend integration
  basic = false, // If true, only shows B, I, U, H1, H2 - no images, tables, links
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

  // Handle image upload - currently disabled, ready for backend integration
  const handleImageUpload = useCallback(
    async (file) => {
      if (!uploadUrl) {
        console.warn("Image upload not configured - backend integration needed");
        return null;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error("Image upload failed:", error);
        return null;
      }
    },
    [uploadUrl]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use custom one
        link: basic ? false : false, // Disable default link to use custom one (or completely disable in basic mode)
        underline: false, // Disable default underline to use custom one
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-6",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-6",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "mb-1",
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: "mb-3 text-foreground",
          },
        },
      }),
      Heading.configure({
        levels: [1, 2],
        HTMLAttributes: {
          1: {
            class: "text-2xl font-bold text-foreground mb-4 mt-6",
          },
          2: {
            class: "text-xl font-semibold text-foreground mb-3 mt-5",
          },
        },
      }),
      // Only include advanced extensions in non-basic mode
      ...(basic
        ? []
        : [
            Link.configure({
              openOnClick: false,
              validate: (href) => /^https?:\/\//.test(href),
              HTMLAttributes: {
                class: "text-primary underline underline-offset-2 hover:text-primary/80",
              },
            }),
            Image.configure({
              inline: false,
              allowBase64: true,
              HTMLAttributes: {
                class: "max-w-full h-auto rounded cursor-pointer",
              },
            }),
            Table.configure({
              resizable: true,
              HTMLAttributes: {
                class: "border-collapse border border-border w-full my-4",
              },
            }),
            TableRow,
            TableHeader.configure({
              HTMLAttributes: {
                class: "bg-muted/50 font-semibold border border-border p-2",
              },
            }),
            TableCell.configure({
              HTMLAttributes: {
                class: "border border-border p-2",
              },
            }),
          ]),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "text-muted-foreground",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Handle Ctrl+K for link creation
        if (event.key === "k" && (event.ctrlKey || event.metaKey) && !disabled) {
          event.preventDefault();
          handleAddLink();
          return true;
        }

        // Handle Tab key for proper indentation
        if (event.key === "Tab" && !disabled) {
          // Only handle tab if we're in a list or if the editor has focus and content
          const isInList = editor.isActive("listItem");
          const hasContent = !editor.isEmpty;
          const shouldHandleTab = isInList || (hasContent && editor.isFocused);

          if (shouldHandleTab) {
            event.preventDefault();

            if (event.shiftKey) {
              // Shift+Tab: outdent or lift list item
              if (isInList) {
                editor.chain().focus().liftListItem("listItem").run();
              }
            } else {
              // Tab: indent or sink list item, otherwise insert tab spaces
              if (isInList) {
                editor.chain().focus().sinkListItem("listItem").run();
              } else {
                // Insert 4 spaces as tab equivalent
                editor.chain().focus().insertContent("    ").run();
              }
            }
            return true;
          }
          // If not handling tab, let browser handle normal tab navigation
          return false;
        }

        // Handle Delete key for table deletion - only with Ctrl/Cmd modifier
        if ((event.key === "Delete" || event.key === "Backspace") && (event.ctrlKey || event.metaKey) && !disabled) {
          // Check if we're in a table
          if (editor.isActive("table")) {
            event.preventDefault();
            editor.chain().focus().deleteTable().run();
            return true;
          }
        }

        // Handle Backspace for exiting empty lists (Word-like behavior)
        if (event.key === "Backspace" && !disabled) {
          const { from } = editor.state.selection;
          const node = editor.state.doc.nodeAt(from);
          const $pos = editor.state.doc.resolve(from);

          // Check if we're in a list item and it's empty
          if (editor.isActive("listItem")) {
            const listItemNode = $pos.node($pos.depth);
            if (listItemNode && listItemNode.textContent.trim() === "") {
              event.preventDefault();
              // Exit list mode by lifting the list item
              editor.chain().focus().liftListItem("listItem").run();
              return true;
            }
          }
        }

        // Handle Enter key for Word-like list creation
        if (event.key === "Enter" && !disabled) {
          const { from, to } = editor.state.selection;
          const textBefore = editor.state.doc.textBetween(Math.max(0, from - 10), from);

          // Check for "- " or "* " at start of line to create bullet list
          if (textBefore.match(/^- $/) || textBefore.match(/^\* $/)) {
            event.preventDefault();
            // Remove the "- " or "* " and create a bullet list
            editor
              .chain()
              .focus()
              .deleteRange({ from: from - 2, to: from })
              .toggleBulletList()
              .run();
            return true;
          }

          // Check for "1. " or "1) " at start of line to create numbered list
          // More flexible pattern to handle different scenarios
          const dotPattern = textBefore.match(/(\d+)\. $/);
          const parenPattern = textBefore.match(/(\d+)\) $/);

          if (dotPattern) {
            event.preventDefault();
            const fullMatch = dotPattern[0]; // The full matched string like "1. "

            // Remove the number pattern and create an ordered list
            editor
              .chain()
              .focus()
              .deleteRange({ from: from - fullMatch.length, to: from })
              .toggleOrderedList()
              .run();
            return true;
          }

          if (parenPattern) {
            event.preventDefault();
            const fullMatch = parenPattern[0]; // The full matched string like "1) "

            // Remove the number pattern and create an ordered list
            editor
              .chain()
              .focus()
              .deleteRange({ from: from - fullMatch.length, to: from })
              .toggleOrderedList()
              .run();
            return true;
          }
        }

        return false;
      },
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData || disabled) return false;

        // In basic mode, disable all paste functionality except text
        if (basic) {
          return false; // Let default text paste work
        }

        // Check for HTML content first (tables from Excel/Google Sheets)
        const htmlData = clipboardData.getData("text/html");
        if (htmlData && htmlData.includes("<table")) {
          event.preventDefault();

          // Parse the HTML and convert to Tiptap table format
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlData, "text/html");
          const sourceTable = doc.querySelector("table");

          if (sourceTable) {
            const rows = Array.from(sourceTable.rows);
            if (rows.length > 0) {
              const maxCols = Math.max(...rows.map((row) => row.cells.length));

              // Build HTML table string
              let tableHTML = "<table>";
              rows.forEach((row) => {
                tableHTML += "<tr>";
                Array.from(row.cells).forEach((cell) => {
                  const cellContent = cell.textContent?.trim() || "";
                  tableHTML += `<td>${cellContent}</td>`;
                });
                // Fill remaining columns if this row has fewer cells
                const missingCells = maxCols - row.cells.length;
                for (let i = 0; i < missingCells; i++) {
                  tableHTML += "<td></td>";
                }
                tableHTML += "</tr>";
              });
              tableHTML += "</table>";

              // Insert the complete table
              editor.chain().focus().insertContent(tableHTML).run();
              return true;
            }
          }
        }

        // Check for plain text table data (tab/newline separated)
        const textData = clipboardData.getData("text/plain");
        if (textData && textData.includes("\t") && textData.includes("\n")) {
          event.preventDefault();

          const rows = textData
            .trim()
            .split("\n")
            .map((row) => row.split("\t"));
          const maxCols = Math.max(...rows.map((row) => row.length));

          if (rows.length > 0 && maxCols > 1) {
            // Build HTML table from tab-separated data
            let tableHTML = "<table>";
            rows.forEach((row) => {
              tableHTML += "<tr>";
              for (let i = 0; i < maxCols; i++) {
                const cellContent = (row[i] || "").trim();
                tableHTML += `<td>${cellContent}</td>`;
              }
              tableHTML += "</tr>";
            });
            tableHTML += "</table>";

            // Insert the complete table
            editor.chain().focus().insertContent(tableHTML).run();
            return true;
          }
        }

        // Handle image paste (only if no table data detected)
        const items = Array.from(clipboardData.items || []);
        const imageItem = items.find((item) => item.type.indexOf("image") === 0);

        if (imageItem) {
          event.preventDefault();

          const file = imageItem.getAsFile();
          if (!file) return false;

          if (!uploadUrl) {
            // Show a user-friendly message when backend isn't ready
            const shouldContinue = window.confirm(
              "Image upload is not yet configured. The image will be stored locally and may not persist. Continue?"
            );
            if (!shouldContinue) return true;

            // Create a local blob URL as fallback
            const url = URL.createObjectURL(file);

            // Check if we can insert an image at current position
            if (!editor.can().setImage({ src: url })) {
              onShowToast("Kan ikke sette inn bilde her. Prøv å plassere markøren i et tekstområde.", "error");
              return true;
            }

            // Insert the image
            try {
              editor.chain().focus().setImage({ src: url }).run();
            } catch (error) {
              console.error("Failed to insert image:", error);
              onShowToast("Feil ved innsetting av bilde. Prøv igjen.", "error");
            }
            return true;
          }

          // Future: Use actual upload
          handleImageUpload(file).then((url) => {
            if (url) {
              // Check if we can insert an image at current position
              if (!editor.can().setImage({ src: url })) {
                onShowToast("Kan ikke sette inn bilde her. Prøv å plassere markøren i et tekstområde.", "error");
                return;
              }

              try {
                editor.chain().focus().setImage({ src: url }).run();
              } catch (error) {
                console.error("Failed to insert uploaded image:", error);
                onShowToast("Feil ved innsetting av bilde. Prøv igjen.", "error");
              }
            }
          });

          return true;
        }

        return false;
      },
      attributes: {
        class: cn(
          "p-4 focus:outline-none text-foreground leading-relaxed",
          "prose prose-sm max-w-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-foreground",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-foreground",
          "[&_p]:text-foreground [&_p]:leading-relaxed [&_p]:mb-3",
          "[&_strong]:text-foreground [&_strong]:font-semibold",
          "[&_em]:text-foreground",
          "[&_ul]:list-disc [&_ol]:list-decimal",
          "[&_li]:text-foreground [&_li]:mb-1",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
          disabled && "opacity-60 cursor-not-allowed"
        ),
      },
    },
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
      `,
        }}
      />

      <TiptapToolbar editor={editor} onAddLink={handleAddLink} uploadUrl={uploadUrl} onShowToast={showToast} basic={basic} />
      <div className="min-h-[120px] max-h-[600px] overflow-y-auto">
        <EditorContent editor={editor} />
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

export default TiptapEditor;
