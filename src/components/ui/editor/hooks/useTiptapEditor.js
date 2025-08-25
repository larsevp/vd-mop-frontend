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
import { Placeholder } from "@tiptap/extension-placeholder";
import { Heading } from "@tiptap/extension-heading";
import { createKeyboardHandler } from "./useEditorKeyboard";
import { createPasteHandler } from "./useEditorPaste";
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
      attributes: {
        class: getEditorStyles(disabled),
      },
    },
  });

  // Add event handlers after editor is created
  React.useEffect(() => {
    if (editor && editor.view) {
      const keydownHandler = createKeyboardHandler(editor, disabled);
      const pasteHandler = createPasteHandler(editor, basic, onShowToast, uploadUrl);

      // Store original handlers so we can restore them
      const originalHandleKeyDown = editor.view.props.handleKeyDown;
      const originalHandlePaste = editor.view.props.handlePaste;

      // Update the editor props
      editor.view.updateState(editor.view.state);
      editor.view.setProps({
        ...editor.view.props,
        handleKeyDown: keydownHandler,
        handlePaste: pasteHandler,
      });

      // Cleanup function to restore original handlers
      return () => {
        if (editor.view) {
          editor.view.setProps({
            ...editor.view.props,
            handleKeyDown: originalHandleKeyDown,
            handlePaste: originalHandlePaste,
          });
        }
      };
    }
  }, [editor, disabled, basic, onShowToast, uploadUrl]);

  return editor;
};
