import React from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Heading } from "@tiptap/extension-heading";
import { SafariBulletList } from "../extensions/SafariBulletList";
import { SmartPasteExtension } from "../extensions/SmartPasteExtension";
import { KeyboardShortcutsExtension } from "../extensions/KeyboardShortcutsExtension";
import { EntityMention } from "../extensions/EntityMentionExtension";
import { getEditorStyles } from "../utils/editorStyles";

export const useTiptapEditor = ({
  value = "",
  onChange,
  placeholder = "Start typing...",
  disabled = false,
  basic = false,
  onShowToast,
  uploadUrl = null,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use custom one
        link: basic ? false : false, // Disable default link to use custom one (or completely disable in basic mode)
        underline: false, // Disable default underline to use custom one
        bulletList: false, // Disable default bulletList to use Safari-compatible one
        // Explicitly enable bold and italic with proper configuration
        bold: {
          HTMLAttributes: {
            class: "font-semibold",
          },
        },
        italic: {
          HTMLAttributes: {
            class: "italic",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-6 space-y-1",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "leading-relaxed",
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: "mb-3 text-foreground",
          },
        },
      }),
      SafariBulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-6 space-y-1",
        },
      }),
      Heading.configure({
        levels: [1, 2],
      }),
      // Only include advanced extensions in non-basic mode
      ...(basic
        ? []
        : [
            Link.extend({
              inclusive: false,
            }).configure({
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
              addAttributes() {
                return {
                  ...this.parent?.(),
                  width: {
                    default: null,
                    parseHTML: (element) => element.getAttribute("width"),
                    renderHTML: (attributes) => {
                      if (!attributes.width) {
                        return {};
                      }
                      return {
                        width: attributes.width,
                        style: `width: ${attributes.width}px;`,
                      };
                    },
                  },
                };
              },
            }),
            Table.configure({
              resizable: true,
              HTMLAttributes: {
                class: "border-collapse border border-border my-4",
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
            EntityMention.configure({
              HTMLAttributes: {
                class: "entity-mention",
              },
            }),
          ]),
      Underline,
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-200 text-yellow-900 px-1 rounded",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "text-muted-foreground",
      }),
      // Safari-compatible smart paste extension
      SmartPasteExtension.configure({
        basic,
        onShowToast,
        uploadUrl,
      }),
      // Safari-compatible keyboard shortcuts extension
      KeyboardShortcutsExtension.configure({
        disabled,
      }),
    ],
    content:
      value ||
      (typeof navigator !== "undefined" && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) ? "<p>A</p>" : ""),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      try {
        // Safari safety check - ensure view is available before getting HTML
        if (!editor.view || !editor.view.dom) {
          return;
        }

        const html = editor.getHTML();
        // Handle Safari's initial test letter and empty paragraph states
        // Also check for the garbage empty paragraph with classes
        const isEmpty =
          html === "<p></p>" ||
          html === "<p>&nbsp;</p>" ||
          html === "<p> </p>" ||
          html === "<p>A</p>" ||
          html === '<p class="mb-3 text-foreground"></p>' ||
          html.trim() === "" ||
          // Check if it's just an empty paragraph with any classes
          /^<p[^>]*><\/p>$/.test(html.trim());
        onChange?.(isEmpty ? null : html);
      } catch (error) {
        console.error('Safari: Failed to get HTML content:', error);
        // Don't call onChange if we can't get the content safely
      }
    },
    editorProps: {
      attributes: {
        class: getEditorStyles(disabled),
      },
    },
  });

  // Note: Removed custom event handler setup that was causing Safari mounting issues
  // TipTap now uses its default event handling which works reliably across all browsers

  return editor;
};
