/**
 * Utilities for handling table paste operations from Word/Excel/Google Sheets
 */

/**
 * Normalize text by removing non-breaking spaces, zero-width characters, and collapsing whitespace
 */
export const normalizeText = (s) =>
  String(s ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Build a minimal, clean HTML table from pasted rich HTML (Word/Excel/Sheets)
 * Extracts only text content and rebuilds table structure
 */
export const buildMinimalTableFromHTML = (html) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const srcTable = doc.querySelector("table");
    if (!srcTable) return null;

    const rows = Array.from(srcTable.rows || []);
    if (!rows.length) return null;

    // Extract plain text from each cell, normalize, and skip fully empty rows
    const textRows = rows.map((tr) => Array.from(tr.cells || []).map((c) => normalizeText(c.textContent)));
    const filtered = textRows.filter((cells) => cells.some((t) => t.length > 0));
    if (!filtered.length) return null;

    const maxCols = Math.max(...filtered.map((r) => r.length));
    const totalCells = filtered.length * maxCols;
    if (totalCells > 2000) return null;

    const esc = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const cellsToHtml = (r) =>
      Array.from({ length: maxCols })
        .map((_, i) => `<td>${esc(r[i] || "")}</td>`)
        .join("");
    const rowsHtml = filtered.map((r) => `<tr>${cellsToHtml(r)}</tr>`).join("");
    return `<table><tbody>${rowsHtml}</tbody></table>`;
  } catch {
    return null;
  }
};

/**
 * Sanitize HTML table by removing Word/Excel noise and inline styles
 * More comprehensive than buildMinimalTableFromHTML but preserves some formatting
 */
export const sanitizeHTMLTable = (html) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const table = doc.querySelector("table");
    if (!table) return null;

    // Remove Word/Excel noise and inline styles
    const allowedTags = new Set(["table", "thead", "tbody", "tr", "th", "td", "br", "span", "b", "strong", "i", "em"]);
    const walk = (node) => {
      // Remove disallowed elements but keep text
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
          const parent = node.parentNode;
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node);
          return;
        }
        // Strip attributes except colspan/rowspan on cells
        const attrsToKeep = new Set(["colspan", "rowspan"]);
        [...node.attributes].forEach((attr) => {
          if (!attrsToKeep.has(attr.name.toLowerCase())) node.removeAttribute(attr.name);
        });
      }
      let child = node.firstChild;
      while (child) {
        const next = child.nextSibling;
        walk(child);
        child = next;
      }
    };
    walk(table);

    // Ensure structure has <tbody>
    if (!table.querySelector("tbody")) {
      const tbody = doc.createElement("tbody");
      const rows = Array.from(table.querySelectorAll("tr"));
      rows.forEach((tr) => tbody.appendChild(tr));
      table.innerHTML = "";
      table.appendChild(tbody);
    }

    // Remove completely empty rows (Excel/Word often injects spacer rows)
    const isCellEmpty = (cell) => {
      // If the cell has media or links, it's not empty
      if (cell.querySelector("img, svg, video, audio, a[href]")) return false;
      // Normalize text: remove NBSP, zero-width spaces, BOM
      const normalized = (cell.textContent || "")
        .replace(/\u00a0/g, " ")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim();
      if (normalized.length > 0) return false;
      // Treat cells that only contain line breaks or empty inline wrappers as empty
      const hasOnlyTrivial = (() => {
        // Clone and strip trivial inline wrappers recursively if they have no text
        const clone = cell.cloneNode(true);
        const stripTrivial = (node) => {
          if (node.nodeType === Node.TEXT_NODE) return;
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const tag = node.tagName.toLowerCase();
          // Remove BRs
          if (tag === "br") {
            node.remove();
            return;
          }
          // For common wrappers, if they contain no text after normalization, unwrap children
          if (["span", "strong", "b", "em", "i", "p", "div", "o:p"].includes(tag)) {
            let text = node.textContent || "";
            text = text
              .replace(/\u00a0/g, " ")
              .replace(/[\u200B-\u200D\uFEFF]/g, "")
              .trim();
            if (text.length === 0) {
              const parent = node.parentNode;
              while (node.firstChild) parent.insertBefore(node.firstChild, node);
              parent.removeChild(node);
              return;
            }
          }
          // Recurse
          Array.from(node.childNodes).forEach(stripTrivial);
        };
        Array.from(clone.childNodes).forEach(stripTrivial);
        const finalText = (clone.textContent || "")
          .replace(/\u00a0/g, " ")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .trim();
        return finalText.length === 0;
      })();
      return hasOnlyTrivial;
    };
    Array.from(table.querySelectorAll("tr")).forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll("th,td"));
      const hasContent = cells.some((td) => !isCellEmpty(td));
      if (!hasContent) tr.remove();
    });

    // Limit excessive size for safety (e.g., 1000 cells)
    const rows = table.querySelectorAll("tr");
    let cellCount = 0;
    rows.forEach((tr) => (cellCount += tr.querySelectorAll("th,td").length));
    if (cellCount > 2000) return null;

    return table.outerHTML;
  } catch {
    return null;
  }
};

/**
 * Build HTML table from TSV (Tab-separated values) data from Excel plain text
 */
export const buildHTMLTableFromTSV = (text) => {
  // Split by newlines but keep ALL lines (including blank ones from Excel)
  const lines = text.split(/\r?\n/);

  // Only filter out the very last line if it's completely empty (trailing newline)
  if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  if (!lines.length) return null;

  // Split to cells and normalize
  const splitRows = lines.map((line) => (line.includes("\t") ? line.split("\t") : [line]));
  const normalized = splitRows.map((cells) => cells.map((c) => normalizeText(c)));

  // Keep ALL rows, even if cells are empty (preserves table structure from Excel)
  const rows = normalized;
  if (!rows.length) return null;

  const maxCols = Math.max(...rows.map((r) => r.length));
  const totalCells = rows.length * maxCols;
  if (totalCells > 2000) return null;

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  // Pad rows to maxCols so all rows have same number of cells
  const cellsToHtml = (r) =>
    Array.from({ length: maxCols }, (_, i) => `<td>${esc(r[i] || "")}</td>`).join("");

  const rowsHtml = rows.map((r) => `<tr>${cellsToHtml(r)}</tr>`).join("");
  return `<table><tbody>${rowsHtml}</tbody></table>`;
};
