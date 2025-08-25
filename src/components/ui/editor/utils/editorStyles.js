import { cn } from "@/lib/utils";

/**
 * Editor styling utilities for TipTap editor
 */

/**
 * Get the CSS classes for the editor's editorProps.attributes
 */
export const getEditorStyles = (disabled = false) => {
  return cn(
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
  );
};
