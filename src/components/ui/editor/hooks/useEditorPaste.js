import { buildMinimalTableFromHTML, buildHTMLTableFromTSV } from "../utils/tablePaste";
import { storeTempImage } from "@/utils/tempImageStorage";
import { cleanPDFText } from "../utils/pdfTextCleaner";

/**
 * Paste handler functions for TipTap editor
 */
export const createPasteHandler = (editor, basic = false, onShowToast, uploadUrl = null) => {
  return (view, event) => {
    // If no editor available, don't handle paste
    if (!editor) return false;
    const clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) return false;

    // Get commonly used data early
    const textData = clipboardData.getData("text/plain");
    const htmlData = clipboardData.getData("text/html");
    const items = Array.from(clipboardData.items || []);

    // Don't process tables in basic mode (no table extension)
    if (basic) return false;

    // STAGE 1: Check for images - but only if there's no meaningful text content
    // Word often includes both text and image data, prioritize text
    const imageItem = items.find((item) => item.type.indexOf("image") === 0);
    const hasTextContent = textData && textData.trim().length > 0;
    const hasHtmlContent = htmlData && htmlData.trim().length > 0;

    if (imageItem && !hasTextContent && !hasHtmlContent) {
      event.preventDefault();

      const file = imageItem.getAsFile();
      if (!file) return false;

      // Check if we can insert an image at current position
      if (!editor.can || !editor.can().setImage({ src: "" })) {
        onShowToast?.("Kan ikke sette inn bilde her. Prøv å plassere markøren i et tekstområde.", "error");
        return true;
      }

      // Store image in localStorage and display immediately
      (async () => {
        try {
          onShowToast?.("Lagrer bilde lokalt...", "info");

          // Store the image in localStorage
          const tempImageData = await storeTempImage(file);

          // Insert the image using the base64 data URL
          try {
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

    // STAGE 2: Check for tables - only intercept REAL table data
    // TipTap industry practice: Let TipTap handle HTML naturally, only intercept special cases

    // TSV data (Excel plain text) - this is a clear table indicator
    // Be VERY strict: must look like actual tabular data, not just contain tabs
    if (textData && textData.includes("\t")) {
      const lines = textData.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const linesWithTabs = lines.filter((l) => l.includes("\t"));

      // Check if this looks like Word content (exclude from TSV processing)
      const looksLikeWordContent =
        htmlData &&
        (htmlData.includes("MsoNormal") ||
          htmlData.includes("mso-") ||
          htmlData.includes("xmlns:") ||
          htmlData.includes("<!--[if") ||
          htmlData.includes("Microsoft"));

      // STRICT criteria for TSV:
      // 1. Must have multiple lines with tabs (not just one line)
      // 2. Most lines should have tabs (at least 50%)
      // 3. Should have consistent column structure
      // 4. Must NOT be Word content
      const hasMultipleLinesWithTabs = linesWithTabs.length >= 2;
      const mostLinesHaveTabs = linesWithTabs.length >= lines.length * 0.5;

      if (hasMultipleLinesWithTabs && mostLinesHaveTabs && !looksLikeWordContent) {
        const tableHtml = buildHTMLTableFromTSV(textData);
        if (tableHtml) {
          event.preventDefault();
          try {
            editor.chain().focus().insertContent(tableHtml).run();
            editor.commands?.fixTables?.();
            onShowToast?.("Tabell limt inn fra Excel-tekst.", "info");
            return true;
          } catch (e) {
            onShowToast?.("Kunne ikke opprette tabell.", "error");
            return true;
          }
        }
      }
    }

    // HTML tables - ONLY intercept if we're absolutely certain it's structured data
    if (htmlData && htmlData.includes("<table")) {
      // FLIPPED LOGIC: Only intercept if we're 100% sure it's a data table
      // Be extremely conservative - when in doubt, let TipTap handle it
      const isDefinitelyDataTable = (() => {
        const tableMatch = htmlData.match(/<table[^>]*>(.*?)<\/table>/is);
        if (!tableMatch) return false;

        const tableContent = tableMatch[1];
        const rowCount = (tableContent.match(/<tr[^>]*>/gi) || []).length;
        const cellCount = (tableContent.match(/<td[^>]*>|<th[^>]*>/gi) || []).length;
        const hasHeaders = (tableContent.match(/<th[^>]*>/gi) || []).length > 0;

        // STRICT criteria for data tables:
        // 1. Must have table headers (th) - clear sign of structured data
        // 2. OR multiple rows AND multiple columns (at least 2x2)
        // 3. AND no signs of being a layout table

        const hasMultipleRowsAndColumns = rowCount >= 2 && cellCount >= 4;
        const hasStructuredHeaders = hasHeaders && cellCount >= 2;

        // Red flags that suggest layout table (skip if any are present)
        const layoutTableRedFlags = [
          htmlData.includes('border="0"'),
          htmlData.includes('cellpadding="0"'),
          htmlData.includes('cellspacing="0"'),
          rowCount === 1 && cellCount === 1, // Single cell = layout
          !hasHeaders && rowCount === 1, // Single row without headers = layout
        ];

        const hasLayoutFlags = layoutTableRedFlags.some((flag) => flag);

        return (hasStructuredHeaders || hasMultipleRowsAndColumns) && !hasLayoutFlags;
      })();

      if (isDefinitelyDataTable) {
        const tableHtml = buildMinimalTableFromHTML(htmlData);
        if (tableHtml) {
          event.preventDefault();
          try {
            editor.chain().focus().insertContent(tableHtml).run();
            editor.commands?.fixTables?.();
            onShowToast?.("Tabell limt inn.", "info");
            return true;
          } catch (e) {
            // Fallback to TipTap
          }
        }
      } else {
        return false; // Let TipTap handle it
      }
    }

    // STAGE 3: Check for PDF text (multi-line plain text)
    // Apply PDF cleaning if we have multi-line text that's NOT rich Word content
    if (textData && textData.includes("\n")) {
      const isRichWordContent =
        htmlData &&
        (htmlData.includes("MsoNormal") ||
          htmlData.includes("mso-") ||
          htmlData.includes("xmlns:") ||
          htmlData.includes("<!--[if") ||
          htmlData.includes("Microsoft") ||
          htmlData.includes("<table") ||
          (htmlData.includes("style=") && htmlData.length > 200)); // Rich styling

      if (!isRichWordContent) {
        event.preventDefault();
        const cleanedText = cleanPDFText(textData);

        // Insert the cleaned text as proper HTML paragraphs
        const paragraphs = cleanedText.split("\n\n");
        const htmlContent = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");

        editor.chain().focus().insertContent(htmlContent).run();

        onShowToast?.("Tekst limt inn og formatert.", "info");
        return true;
      }
    }

    // STAGE 4: Normal paste (single line text or anything else)
    return false;
  };
};
