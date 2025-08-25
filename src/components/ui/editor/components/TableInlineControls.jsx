import React from "react";
import { createPortal } from "react-dom";
import { Plus, Minus } from "lucide-react";
import { CellSelection, TableMap } from "@tiptap/pm/tables";

const btnBase =
  "inline-flex items-center justify-center h-6 w-6 rounded border bg-background text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm";

export function TableInlineControls({ editor }) {
  const [visible, setVisible] = React.useState(false);
  const [rowY, setRowY] = React.useState(0);
  const [rowX, setRowX] = React.useState(0);
  const [colX, setColX] = React.useState(0);
  const [colY, setColY] = React.useState(0);
  const [showRowControls, setShowRowControls] = React.useState(false);
  const [showColControls, setShowColControls] = React.useState(false);

  const computePositions = React.useCallback(() => {
    const view = editor?.view;
    if (!view || !editor.isActive("table")) {
      setVisible(false);
      return;
    }
    const sel = view.state.selection;
    const $cell = sel.$anchorCell;
    if (!$cell) {
      setVisible(false);
      return;
    }
    // Find DOM cell element and table
    const pos = $cell.pos;
    const dom = view.domAtPos(pos);
    let el = dom?.node;
    if (el && el.nodeType === Node.TEXT_NODE) el = el.parentElement;
    const cellEl = el?.closest?.("td, th");
    const tableEl = el?.closest?.("table");
    if (!cellEl || !tableEl) {
      setVisible(false);
      return;
    }

    const cellRect = cellEl.getBoundingClientRect();
    const tableRect = tableEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // If table is completely outside viewport, hide
    if (tableRect.bottom < 0 || tableRect.top > vh || tableRect.right < 0 || tableRect.left > vw) {
      setVisible(false);
      return;
    }

    const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
    const margin = 8; // px

    // Row controls: left of the current row (aligned vertically to row center)
    const ry = Math.round(cellRect.top + cellRect.height / 2);
    const rx = Math.round(tableRect.left) - margin; // gap from table edge
    setRowY(clamp(ry, margin, vh - margin));
    // Reserve ~40px width for the vertical button stack
    setRowX(clamp(rx - 36, margin, vw - 40));
    setShowRowControls(true);

    // Column controls: above current column (aligned to column center)
    const cx = Math.round(cellRect.left + cellRect.width / 2);
    const cy = Math.round(tableRect.top) - margin; // gap from table edge
    // Reserve ~130px width for the horizontal button row
    setColX(clamp(cx - 10, margin, vw - 130));
    setColY(clamp(cy - 36, margin, vh - 40));
    setShowColControls(true);

    setVisible(true);
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    const update = () => computePositions();
    editor.on("selectionUpdate", update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    computePositions();
    return () => {
      editor.off("selectionUpdate", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [editor, computePositions]);

  if (!visible) return null;

  const selectRow = () => {
    const { state, dispatch } = editor.view;
    const sel = state.selection;
    const $cell = sel.$anchorCell;
    if (!$cell) return;
    // Find table node and pos
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
  };

  const selectColumn = () => {
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
  };

  const addRowAbove = () => editor.chain().focus().addRowBefore().run();
  const addRowBelow = () => editor.chain().focus().addRowAfter().run();
  const deleteRow = () => editor.chain().focus().deleteRow().run();
  const addColLeft = () => editor.chain().focus().addColumnBefore().run();
  const addColRight = () => editor.chain().focus().addColumnAfter().run();
  const deleteCol = () => editor.chain().focus().deleteColumn().run();

  return createPortal(
    <>
      {showRowControls && (
        <div style={{ position: "fixed", top: rowY, left: rowX, zIndex: 9999 }} className="flex flex-col gap-1 pointer-events-auto">
          <button className={btnBase} title="Select row" onMouseDown={(e) => e.preventDefault()} onClick={selectRow}>
            R
          </button>
          <button className={btnBase} title="Add row above" onMouseDown={(e) => e.preventDefault()} onClick={addRowAbove}>
            <Plus size={14} />
          </button>
          <button className={btnBase} title="Add row below" onMouseDown={(e) => e.preventDefault()} onClick={addRowBelow}>
            <Plus size={14} />
          </button>
          <button className={btnBase} title="Delete row" onMouseDown={(e) => e.preventDefault()} onClick={deleteRow}>
            <Minus size={14} />
          </button>
        </div>
      )}
      {showColControls && (
        <div style={{ position: "fixed", top: colY, left: colX, zIndex: 9999 }} className="flex flex-row gap-1 pointer-events-auto">
          <button className={btnBase} title="Select column" onMouseDown={(e) => e.preventDefault()} onClick={selectColumn}>
            C
          </button>
          <button className={btnBase} title="Add column left" onMouseDown={(e) => e.preventDefault()} onClick={addColLeft}>
            <Plus size={14} />
          </button>
          <button className={btnBase} title="Add column right" onMouseDown={(e) => e.preventDefault()} onClick={addColRight}>
            <Plus size={14} />
          </button>
          <button className={btnBase} title="Delete column" onMouseDown={(e) => e.preventDefault()} onClick={deleteCol}>
            <Minus size={14} />
          </button>
        </div>
      )}
    </>,
    document.body
  );
}
