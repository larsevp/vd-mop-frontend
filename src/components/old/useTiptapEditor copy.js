import { useEditor } from "@tiptap/react";
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

export const useTiptapEditor_old = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
  disabled = false,
  basic = false,
  onShowToast,
}) => {
  // --- Helpers for paste handling (Word/Excel tables) ---
  const normalizeText = (s) =>
    String(s ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Build a minimal, clean HTML table from pasted rich HTML (Word/Excel/Sheets)
  const buildMinimalTableFromHTML = (html) => {
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
  const sanitizeHTMLTable = (html) => {
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

  const buildHTMLTableFromTSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (!lines.length) return null;

    // Split to cells and normalize; drop rows that are entirely empty
    const splitRows = lines.map((line) => (line.includes("\t") ? line.split("\t") : [line]));
    const normalized = splitRows.map((cells) => cells.map((c) => normalizeText(c)));
    const rows = normalized.filter((cells) => cells.some((t) => t.length > 0));
    if (!rows.length) return null;

    const maxCols = Math.max(...rows.map((r) => r.length));
    const totalCells = rows.length * maxCols;
    if (totalCells > 2000) return null;

    const esc = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const cellsToHtml = (r) => r.map((c) => `<td>${esc(c)}</td>`).join("");
    const rowsHtml = rows.map((r) => `<tr>${cellsToHtml(r)}</tr>`).join("");
    return `<table><tbody>${rowsHtml}</tbody></table>`;
  };

  // Handle image upload - currently disabled, ready for backend integration
  const handleImageUpload = async (file) => {
    // Future implementation
    return null;
  };

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
          const handleAddLink = () => {
            if (!editor) return;
            const url = window.prompt("Enter full URL (including http:// or https://):");
            if (url) {
              const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
              editor.chain().focus().extendMarkRange("link").setLink({ href: fullUrl }).run();
            }
          };
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
          if (editor.isActive("table")) {
            const shouldDelete = window.confirm("Delete the entire table?");
            if (shouldDelete) {
              event.preventDefault();
              editor.chain().focus().deleteTable().run();
              return true;
            }
          }
        }

        // Handle Enter key to create lists from patterns
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
          const dotPattern = textBefore.match(/(\d+)\. $/);
          const parenPattern = textBefore.match(/(\d+)\) $/);

          if (dotPattern) {
            event.preventDefault();
            const fullMatch = dotPattern[0];
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
            const fullMatch = parenPattern[0];
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
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return false;

        // Don't process tables in basic mode (no table extension)
        if (basic) return false;

        // 1) Prefer HTML tables from Word/Excel: rebuild a minimal clean table (text-only)
        const htmlData = clipboardData.getData("text/html");
        if (htmlData && htmlData.includes("<table")) {
          const tableHtml = buildMinimalTableFromHTML(htmlData);
          if (tableHtml) {
            event.preventDefault();
            try {
              editor.chain().focus().insertContent(tableHtml).run();
              // Normalize structure just in case
              editor.commands?.fixTables?.();
              onShowToast?.("Tabell limt inn.", "info");
              return true;
            } catch (e) {
              console.warn("Failed to insert rebuilt HTML table, will try TSV fallback.", e);
            }
          }
        }

        // 2) Fallback: TSV (Excel plain text)
        const textData = clipboardData.getData("text/plain");
        if (textData && textData.includes("\t")) {
          const lines = textData.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 0 && lines.some((l) => l.includes("\t"))) {
            const tableHtml = buildHTMLTableFromTSV(textData);
            if (tableHtml) {
              event.preventDefault();
              try {
                editor.chain().focus().insertContent(tableHtml).run();
                editor.commands?.fixTables?.();
                onShowToast?.("Tabell limt inn fra Excel-tekst.", "info");
                return true;
              } catch (e) {
                console.error("Failed to insert generated table:", e);
                onShowToast?.("Kunne ikke opprette tabell.", "error");
                return true;
              }
            }
          }
        }

        // Handle image paste (only if no table data detected)
        const items = Array.from(clipboardData.items || []);
        const imageItem = items.find((item) => item.type.indexOf("image") === 0);

        if (imageItem) {
          event.preventDefault();

          const file = imageItem.getAsFile();
          if (!file) return false;

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

        return false;
      },
      attributes: {
        class: cn(
          "p-4 focus:outline-none text-foreground leading-relaxed",
          "prose prose-sm max-w-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-foreground",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-foreground",
          "[&_p]:text-foreground [&_p]:leading-relaxed [&_p]:mb-3",
          // Remove paragraph margins inside table cells to prevent visual "blank" rows
          "[&_td>p]:m-0 [&_th>p]:m-0 [&_td>p:last-child]:mb-0 [&_th>p:last-child]:mb-0",
          // Top-align table cell content for consistency
          "[&_td]:align-top [&_th]:align-top",
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

  return editor;
};
