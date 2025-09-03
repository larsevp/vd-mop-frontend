import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TableDropdown } from "./TableDropdown";
import { ImageIcon } from "lucide-react";
import { CellSelection, TableMap } from "@tiptap/pm/tables";

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

export const TiptapToolbar = ({ editor, onAddLink, uploadUrl, onShowToast, basic = false }) => {
  if (!editor) return null;

  // Track whether selection is inside a table to drive conditional UI and force re-render on selection changes
  const [isInTable, setIsInTable] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);

  useEffect(() => {
    const updateSelection = () => {
      setIsInTable(editor.isActive("table"));
      setIsImageSelected(editor.isActive("image"));
    };

    editor.on("selectionUpdate", updateSelection);
    editor.on("transaction", updateSelection); // Also listen to transactions
    updateSelection();

    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("transaction", updateSelection);
    };
  }, [editor]);

  // Toggle mark across a multi-cell selection if present; otherwise act normally
  const toggleMarkAcrossCells = useCallback(
    (type) => {
      const { state } = editor;
      const sel = state.selection;
      const doc = state.doc;
      const applyToSelectedCells = (cb) => {
        const $cell = sel.$anchorCell;
        // Find the table node and its start position
        let tableNode = null;
        let tablePos = null;
        for (let d = $cell.depth; d > 0; d--) {
          const node = $cell.node(d);
          if (node.type && node.type.name === "table") {
            tableNode = node;
            tablePos = $cell.before(d);
            break;
          }
        }
        if (!tableNode || tablePos == null) return false;

        const map = TableMap.get(tableNode);
        const tableStart = tablePos + 1;
        const anchorRel = sel.$anchorCell.pos - tableStart;
        const headRel = sel.$headCell.pos - tableStart;
        const rect = map.rectBetween(anchorRel, headRel);
        const cells = map.cellsInRect(rect);
        cells.forEach((relPos) => {
          const absolutePos = tableStart + relPos;
          const cellNode = doc.nodeAt(absolutePos);
          if (!cellNode) return;
          const from = absolutePos + 1;
          const to = from + cellNode.content.size;
          if (to > from) cb(from, to);
        });
        return true;
      };
      const runToggle = (from, to) => {
        const chain = editor.chain().focus().setTextSelection({ from, to });
        switch (type) {
          case "bold":
            chain.toggleBold().run();
            break;
          case "italic":
            chain.toggleItalic().run();
            break;
          case "underline":
            chain.toggleUnderline().run();
            break;
          case "highlight":
            chain.toggleHighlight().run();
            break;
          default:
            break;
        }
      };

      if (sel instanceof CellSelection && sel.$anchorCell.pos !== sel.$headCell.pos) {
        const ok = applyToSelectedCells(runToggle);
        if (ok) return true;
      }
      // Fallback: normal toggle on current selection
      switch (type) {
        case "bold":
          editor.chain().focus().toggleBold().run();
          break;
        case "italic":
          editor.chain().focus().toggleItalic().run();
          break;
        case "underline":
          editor.chain().focus().toggleUnderline().run();
          break;
        case "highlight":
          editor.chain().focus().toggleHighlight().run();
          break;
        default:
          break;
      }
      return true;
    },
    [editor]
  );

  // Toggle block-level formatting (paragraph/heading) across a cell selection
  const toggleBlockAcrossCells = useCallback(
    (action, options) => {
      const { state } = editor;
      const sel = state.selection;
      const doc = state.doc;
      const applyToSelectedCells = (cb) => {
        const $cell = sel.$anchorCell;
        let tableNode = null;
        let tablePos = null;
        for (let d = $cell.depth; d > 0; d--) {
          const node = $cell.node(d);
          if (node.type && node.type.name === "table") {
            tableNode = node;
            tablePos = $cell.before(d);
            break;
          }
        }
        if (!tableNode || tablePos == null) return false;

        const map = TableMap.get(tableNode);
        const tableStart = tablePos + 1;
        const anchorRel = sel.$anchorCell.pos - tableStart;
        const headRel = sel.$headCell.pos - tableStart;
        const rect = map.rectBetween(anchorRel, headRel);
        const cells = map.cellsInRect(rect);
        cells.forEach((relPos) => {
          const absolutePos = tableStart + relPos;
          const cellNode = doc.nodeAt(absolutePos);
          if (!cellNode) return;
          const from = absolutePos + 1;
          const to = from + cellNode.content.size;
          if (to > from) cb(from, to);
        });
        return true;
      };
      const runBlock = (from, to) => {
        const chain = editor.chain().focus().setTextSelection({ from, to });
        if (action === "paragraph") {
          // Reset to paragraph and clear common marks
          chain.unsetAllMarks();
          if (editor.isActive("heading")) {
            chain.toggleHeading({ level: 1 });
          }
          chain.setParagraph().run();
          return;
        }
        if (action === "heading") {
          chain.toggleHeading({ level: options?.level || 1 }).run();
          return;
        }
      };

      if (sel instanceof CellSelection && sel.$anchorCell.pos !== sel.$headCell.pos) {
        const ok = applyToSelectedCells(runBlock);
        if (ok) return true;
      }

      // Fallback to normal behavior on current selection
      if (action === "paragraph") {
        editor.chain().focus().unsetAllMarks().setParagraph().run();
      } else if (action === "heading") {
        editor
          .chain()
          .focus()
          .toggleHeading({ level: options?.level || 1 })
          .run();
      }
      return true;
    },
    [editor]
  );

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

  // Select entire row under current cell
  const selectRow = useCallback(() => {
    const { state, dispatch } = editor.view;
    const sel = state.selection;
    const $cell = sel.$anchorCell;
    if (!$cell) return;
    let tableNode = null;
    let tablePos = null;
    for (let d = $cell.depth; d > 0; d--) {
      const node = $cell.node(d);
      if (node.type && node.type.name === "table") {
        tableNode = node;
        tablePos = $cell.before(d);
        break;
      }
    }
    if (!tableNode || tablePos == null) return;
    const map = TableMap.get(tableNode);
    const tableStart = tablePos + 1;
    const anchorRel = sel.$anchorCell.pos - tableStart;
    const rect = map.findCell(anchorRel);
    const rowCells = map.cellsInRect({ left: 0, right: map.width, top: rect.top, bottom: rect.bottom });
    const anchorPos = tableStart + rowCells[0];
    const headPos = tableStart + rowCells[rowCells.length - 1];
    const $anchor = state.doc.resolve(anchorPos);
    const $head = state.doc.resolve(headPos);
    dispatch(state.tr.setSelection(new CellSelection($anchor, $head)).scrollIntoView());
  }, [editor]);

  // Select entire column under current cell
  const selectColumn = useCallback(() => {
    const { state, dispatch } = editor.view;
    const sel = state.selection;
    const $cell = sel.$anchorCell;
    if (!$cell) return;
    let tableNode = null;
    let tablePos = null;
    for (let d = $cell.depth; d > 0; d--) {
      const node = $cell.node(d);
      if (node.type && node.type.name === "table") {
        tableNode = node;
        tablePos = $cell.before(d);
        break;
      }
    }
    if (!tableNode || tablePos == null) return;
    const map = TableMap.get(tableNode);
    const tableStart = tablePos + 1;
    const anchorRel = sel.$anchorCell.pos - tableStart;
    const rect = map.findCell(anchorRel);
    const colCells = map.cellsInRect({ left: rect.left, right: rect.right, top: 0, bottom: map.height });
    const anchorPos = tableStart + colCells[0];
    const headPos = tableStart + colCells[colCells.length - 1];
    const $anchor = state.doc.resolve(anchorPos);
    const $head = state.doc.resolve(headPos);
    dispatch(state.tr.setSelection(new CellSelection($anchor, $head)).scrollIntoView());
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        console.log("🖼️ Frontend: Image selected:", {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        try {
          console.log("📦 Frontend: Storing selected image in localStorage...");
          onShowToast("Lagrer bilde lokalt...", "info");

          // Import the storage function dynamically
          const { storeTempImage } = await import("@/utils/tempImageStorage");

          // Store the image in localStorage
          const tempImageData = await storeTempImage(file);

          console.log("✅ Frontend: Image stored in localStorage:", tempImageData.id);

          // Check if we can insert the image before trying
          if (!editor.can().setImage({ src: tempImageData.url })) {
            console.error("❌ Frontend: Cannot insert image at current position");
            onShowToast("Kan ikke sette inn bilde her. Prøv å plassere markøren i et tekstområde.", "error");
            return;
          }

          // Insert the image using the base64 data URL
          try {
            console.log("� Frontend: Inserting image from localStorage...");
            editor
              .chain()
              .focus()
              .setImage({
                src: tempImageData.url,
                "data-temp-id": tempImageData.id,
                alt: tempImageData.fileName,
              })
              .run();

            console.log("✅ Frontend: Image inserted from localStorage");
            onShowToast("Bilde valgt og lagret! Vil bli lastet opp ved lagring.", "success");
          } catch (insertError) {
            console.error("❌ Frontend: Failed to insert image from localStorage:", insertError);
            onShowToast("Feil ved innsetting av bilde i editoren. Prøv igjen.", "error");
          }
        } catch (error) {
          console.error("❌ Frontend: Failed to store selected image:", error);

          let errorMessage = "Kunne ikke lagre bilde lokalt";
          if (error.message.includes("Storage limit exceeded")) {
            errorMessage = "Lagringsplass fullt. Last opp eksisterende bilder først.";
          } else if (error.message) {
            errorMessage += `: ${error.message}`;
          }

          onShowToast(errorMessage, "error");
        }
      }
    };
    input.click();
  }, [editor, uploadUrl, onShowToast]);

  const toggleBulletList = useCallback(() => {
    // Always just use the normal bullet list toggle
    // The Safari issues should be prevented by the &nbsp; initialization in useTiptapEditor
    editor.chain().focus().toggleBulletList().run();
  }, [editor]);

  return (
    <>
      <div className="border-b border-border p-2 flex items-center gap-1 flex-wrap">
        {/* Text Formatting */}
        <ToolbarButton onClick={() => toggleMarkAcrossCells("bold")} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleMarkAcrossCells("italic")} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleMarkAcrossCells("underline")} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleMarkAcrossCells("highlight")} active={editor.isActive("highlight")} title="Highlight (Ctrl+H)">
          <span className="bg-yellow-200 text-yellow-900 px-1 rounded font-semibold">H</span>
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Headings */}
        {!basic && (
          <ToolbarButton
            onClick={() => {
              toggleBlockAcrossCells("paragraph");
              if (editor.isActive("link")) editor.chain().focus().unsetLink().run();
            }}
            active={!editor.isActive("heading")}
            title="Normal Text (removes links and headings)"
          >
            Normal
          </ToolbarButton>
        )}
        <ToolbarButton
          onClick={() => toggleBlockAcrossCells("heading", { level: 1 })}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => toggleBlockAcrossCells("heading", { level: 2 })}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton onClick={toggleBulletList} active={editor.isActive("bulletList")} title="Bullet List">
          • List
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

            {!isInTable && (
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
            )}
          </>
        )}
      </div>

      {/* Horizontal Table Tools row when a table is active */}
      {isInTable && (
        <div className="border-b border-border px-2 py-1 flex items-center gap-1 bg-muted/30">
          <span className="text-xs text-muted-foreground mr-2">Table</span>
          <ToolbarButton onClick={addRowAfter} title="Add row below">
            Row +
          </ToolbarButton>
          <ToolbarButton onClick={deleteRow} title="Delete row">
            Row −
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={addColumnAfter} title="Add column right">
            Col +
          </ToolbarButton>
          <ToolbarButton onClick={deleteColumn} title="Delete column">
            Col −
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={deleteTable} title="Delete table" className="text-destructive border-destructive">
            Delete table
          </ToolbarButton>
        </div>
      )}

      {/* Horizontal Image Tools row when an image is selected */}
      {isImageSelected && (
        <div className="border-b border-border px-2 py-1 flex items-center gap-1 bg-muted/30">
          <span className="text-xs text-muted-foreground mr-2">Image</span>
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
          <ToolbarSeparator />
          <ToolbarButton
            onClick={() => {
              editor.chain().focus().deleteSelection().run();
            }}
            title="Slett bilde"
            className="text-destructive border-destructive"
          >
            Slett
          </ToolbarButton>
        </div>
      )}
    </>
  );
};
