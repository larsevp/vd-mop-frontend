import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { buildMinimalTableFromHTML, buildHTMLTableFromTSV } from '../utils/tablePaste';
import { storeTempImage } from '@/utils/tempImageStorage';
import { cleanPDFText } from '../utils/pdfTextCleaner';

/**
 * Smart Paste Extension for TipTap
 * 
 * Handles:
 * - Image uploads on paste
 * - Excel/CSV data to table conversion
 * - PDF text cleaning
 * - HTML table processing
 * 
 * This is the Safari-safe way to implement paste handling in TipTap
 */
export const SmartPasteExtension = Extension.create({
  name: 'smartPaste',

  priority: 1000, // High priority to run before default paste handlers

  addOptions() {
    return {
      basic: false,
      onShowToast: null,
      uploadUrl: null,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('smartPaste'),
        props: {
          handlePaste: (view, event) => {
            const options = this.options;
            const editor = this.editor; // Store editor reference correctly

            // In basic mode, only allow text cleaning (no images/tables)
            const isBasic = options.basic;

            const clipboardData = event.clipboardData || window.clipboardData;
            if (!clipboardData) return false;

            // Get commonly used data early
            const textData = clipboardData.getData('text/plain');
            const htmlData = clipboardData.getData('text/html');
            const items = Array.from(clipboardData.items || []);

            // Helper functions
            const isTabularData = (text) => {
              if (!text) return false;

              // Excel/CSV detection: Look for tabs or commas in a CONSISTENT structured way
              const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

              if (lines.length < 2) return false; // Need at least 2 lines for a table

              // TAB-delimited detection: Check if tabs appear CONSISTENTLY across lines
              const tabsPerLine = lines.map(line => (line.match(/\t/g) || []).length);
              const hasConsistentTabs = tabsPerLine.every(count => count > 0) &&
                                        Math.max(...tabsPerLine) - Math.min(...tabsPerLine) <= 1;

              if (hasConsistentTabs && tabsPerLine[0] >= 1) {
                return true;
              }

              // CSV detection: Check if commas appear CONSISTENTLY across lines
              // AND average line length is relatively short (< 100 chars suggests CSV, not prose)
              const commasPerLine = lines.map(line => (line.match(/,/g) || []).length);
              const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
              const hasConsistentCommas = commasPerLine.every(count => count > 0) &&
                                          Math.max(...commasPerLine) - Math.min(...commasPerLine) <= 2;

              if (hasConsistentCommas && commasPerLine[0] >= 1 && avgLineLength < 100) {
                return true;
              }

              return false;
            };

            const containsHTMLTable = (html) => {
              return html && html.includes('<table') && html.includes('</table>');
            };

            const isPDFText = (text) => {
              if (!text) return false;
              const pdfIndicators = [
                /\u00A0{2,}/, // Multiple non-breaking spaces
                /\n\s*\n\s*\n/, // Multiple consecutive line breaks
                /\w+\s+\w+\s+\w+\s+\w+\s+\w+.*\n/, // Very long lines
                /^\d+\s*$/, // Lone numbers (page numbers)
              ];
              
              return pdfIndicators.some(pattern => pattern.test(text));
            };

            // STAGE 1: Check for images - but only if there's no meaningful text content and not in basic mode
            const imageItem = items.find(item => item.type.indexOf('image') === 0);
            const hasTextContent = textData && textData.trim().length > 0;
            const hasHtmlContent = htmlData && htmlData.trim().length > 0;

            if (!isBasic && imageItem && !hasTextContent && !hasHtmlContent) {
              event.preventDefault();
              
              // Handle image paste inline
              const file = imageItem.getAsFile();
              if (!file) return false;

              // Show loading toast
              if (options.onShowToast) {
                options.onShowToast('Processing image...', 'info');
              }

              // Handle file - always use base64 for now (more reliable)
              const reader = new FileReader();
              reader.onload = (e) => {
                const { state } = view;
                const { schema } = state;
                
                // Insert image node
                if (schema.nodes.image) {
                  const imageNode = schema.nodes.image.create({ src: e.target.result });
                  const tr = state.tr.replaceSelectionWith(imageNode);
                  view.dispatch(tr);
                  
                  if (options.onShowToast) {
                    options.onShowToast('Image inserted successfully', 'success');
                  }
                }
              };
              
              reader.onerror = () => {
                if (options.onShowToast) {
                  options.onShowToast('Failed to process image', 'error');
                }
              };
              
              reader.readAsDataURL(file);
              return true;
            }

            // STAGE 2: Check for Excel/CSV tabular data (not in basic mode)
            if (!isBasic && isTabularData(textData)) {
              try {
                const tableHTML = buildHTMLTableFromTSV(textData);

                if (tableHTML && view.state.schema.nodes.table) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(tableHTML, 'text/html');
                  const tableElement = doc.querySelector('table');

                  if (tableElement) {
                    event.preventDefault();

                    // Use TipTap's editor.chain() API to insert the table HTML
                    if (editor && editor.chain) {
                      editor.chain().focus().insertContent(tableHTML).run();
                    } else {
                      const { state } = view;
                      const tr = state.tr.insertText(textData);
                      view.dispatch(tr);
                    }

                    if (options.onShowToast) {
                      options.onShowToast('Tabell limt inn', 'success');
                    }
                    return true;
                  }
                }

                // If we can't handle it as a table, fall through to Stage 3 for text cleaning
              } catch (error) {
                console.error('SmartPaste - Table creation error:', error);
                // Fall through to Stage 3
              }
            }

            // STAGE 3: Handle text cleaning
            if (textData && textData.trim().length > 0) {
              // Check if we should preserve HTML formatting (Word button was clicked)
              const preserveFormatting = editor.storage.smartPaste?.preserveFormatting || false;

              if (preserveFormatting) {
                // Reset the flag and let TipTap handle normally (preserves Word/HTML formatting)
                // But we already handled images and tables in Stage 1 & 2, so this is just for text
                editor.storage.smartPaste.preserveFormatting = false;
                if (options.onShowToast) {
                  options.onShowToast('Formatering bevart fra Word/HTML', 'success');
                }
                return false; // Let TipTap handle with formatting - NO PDF cleaning
              }

              // For normal paste (Ctrl+V), clean the text
              event.preventDefault();

              try {
                const cleanedText = cleanPDFText(textData, true); // Always force cleaning

                // Insert at current selection with proper state handling
                const { state } = view;
                const { selection, schema } = state;

                // Both basic and richtext: convert newlines to proper structure
                // Basic mode uses simple paragraphs, richtext uses TipTap paragraph nodes
                const paragraphs = cleanedText.split('\n\n').filter(p => p.trim());

                if (paragraphs.length === 0) {
                  // No content
                  return true;
                }

                if (isBasic) {
                  // Basic mode: just insert the cleaned text as-is
                  const tr = state.tr.insertText(cleanedText, selection.from, selection.to);
                  view.dispatch(tr);
                } else {
                  // Richtext mode: create proper paragraph nodes for each paragraph
                  const nodes = [];

                  paragraphs.forEach(para => {
                    // Each paragraph becomes one paragraph node
                    // Single newlines within become hard breaks
                    const lines = para.split('\n').filter(l => l.trim());

                    if (lines.length === 1) {
                      // Single line paragraph
                      const textNode = schema.text(lines[0]);
                      nodes.push(schema.nodes.paragraph.create(null, textNode));
                    } else {
                      // Multiple lines: use hard breaks between them
                      const content = [];
                      lines.forEach((line, idx) => {
                        content.push(schema.text(line));
                        if (idx < lines.length - 1) {
                          content.push(schema.nodes.hardBreak.create());
                        }
                      });
                      nodes.push(schema.nodes.paragraph.create(null, content));
                    }
                  });

                  const tr = state.tr.replaceWith(selection.from, selection.to, nodes);
                  view.dispatch(tr);
                }

                if (options.onShowToast) {
                  options.onShowToast('Tekst renset og formatert', 'success');
                }
              } catch (error) {
                console.error('SmartPaste - Text cleaning failed:', error);
                return false;
              }

              return true;
            }

            // Let TipTap handle normal paste
            return false;
          }
        }
      })
    ];
  }
});