import { buildMinimalTableFromHTML, buildHTMLTableFromTSV } from "../utils/tablePaste";
import { storeTempImage } from "@/utils/tempImageStorage";

/**
 * Paste handler functions for TipTap editor
 */
export const createPasteHandler = (editor, basic = false, onShowToast, uploadUrl = null) => {
  return (view, event) => {
    // If no editor available, don't handle paste
    if (!editor) return false;
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

      console.log("🖼️ Frontend: Image pasted:", {
        name: file.name || "pasted-image",
        size: file.size,
        type: file.type,
      });

      // Check if we can insert an image at current position
      if (!editor.can || !editor.can().setImage({ src: "" })) {
        onShowToast?.("Kan ikke sette inn bilde her. Prøv å plassere markøren i et tekstområde.", "error");
        return true;
      }

      // Store image in localStorage and display immediately
      (async () => {
        try {
          console.log("📦 Frontend: Storing pasted image in localStorage...");
          onShowToast?.("Lagrer bilde lokalt...", "info");

          // Store the image in localStorage
          const tempImageData = await storeTempImage(file);

          console.log("✅ Frontend: Image stored in localStorage:", tempImageData.id);

          // Insert the image using the base64 data URL
          try {
            console.log("📝 Frontend: Inserting image from localStorage...");
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
            onShowToast?.("Bilde limt inn! Vil bli lastet opp ved lagring.", "success");
          } catch (insertError) {
            console.error("❌ Frontend: Failed to insert image from localStorage:", insertError);
            onShowToast?.("Feil ved innsetting av bilde. Prøv igjen.", "error");
          }
        } catch (error) {
          console.error("❌ Frontend: Failed to store pasted image:", error);

          let errorMessage = "Kunne ikke lagre bilde lokalt";
          if (error.message.includes("Storage limit exceeded")) {
            errorMessage = "Lagringsplass fullt. Last opp eksisterende bilder først.";
          } else if (error.message) {
            errorMessage += `: ${error.message}`;
          }

          onShowToast?.(errorMessage, "error");
        }
      })();

      return true;
    }

    return false;
  };
};
