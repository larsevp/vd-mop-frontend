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
            const editor = view.state.tr.doc;
            const options = this.options;
            
            // Don't process in basic mode (no advanced features)
            if (options.basic) return false;

            const clipboardData = event.clipboardData || window.clipboardData;
            if (!clipboardData) return false;

            // Get commonly used data early
            const textData = clipboardData.getData('text/plain');
            const htmlData = clipboardData.getData('text/html');
            const items = Array.from(clipboardData.items || []);

            // Helper functions
            const isTabularData = (text) => {
              if (!text) return false;
              const lines = text.split('\n').filter(line => line.trim());
              if (lines.length < 2) return false;
              
              const firstLineTabCount = (lines[0].match(/\t/g) || []).length;
              const firstLineCommaCount = (lines[0].match(/,/g) || []).length;
              
              if (firstLineTabCount === 0 && firstLineCommaCount === 0) return false;
              
              const delimiter = firstLineTabCount > firstLineCommaCount ? '\t' : ',';
              const expectedCount = delimiter === '\t' ? firstLineTabCount : firstLineCommaCount;
              
              let matchingLines = 0;
              for (const line of lines) {
                const delimiterCount = (line.match(new RegExp(delimiter === '\t' ? '\\t' : ',', 'g')) || []).length;
                if (Math.abs(delimiterCount - expectedCount) <= 1) {
                  matchingLines++;
                }
              }
              
              return (matchingLines / lines.length) >= 0.8;
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

            // STAGE 1: Check for images - but only if there's no meaningful text content
            const imageItem = items.find(item => item.type.indexOf('image') === 0);
            const hasTextContent = textData && textData.trim().length > 0;
            const hasHtmlContent = htmlData && htmlData.trim().length > 0;

            if (imageItem && !hasTextContent && !hasHtmlContent) {
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

            // STAGE 2: Check for Excel/CSV tabular data
            if (isTabularData(textData)) {
              event.preventDefault();
              
              try {
                const tableHTML = buildHTMLTableFromTSV(textData);
                if (tableHTML && view.state.schema.nodes.table) {
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(tableHTML, 'text/html');
                  const tableElement = doc.querySelector('table');
                  
                  if (tableElement) {
                    // Simple table insertion
                    const { state } = view;
                    const tr = state.tr.insertText(textData); // Fallback to text for now
                    view.dispatch(tr);
                    
                    if (options.onShowToast) {
                      options.onShowToast('Table data pasted', 'success');
                    }
                  }
                }
              } catch (error) {
                console.error('Table creation failed:', error);
                // Let TipTap handle as normal text
                return false;
              }
              
              return true;
            }

            // STAGE 3: Clean PDF text if detected
            if (isPDFText(textData)) {
              event.preventDefault();
              
              try {
                const cleanedText = cleanPDFText(textData, true);
                const { state } = view;
                const schema = state.schema;
                
                // Convert cleaned text with paragraph breaks to proper HTML
                const paragraphs = cleanedText.split('\n\n').filter(p => p.trim());
                
                if (paragraphs.length > 1) {
                  // Create proper HTML with paragraph tags
                  const htmlContent = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
                  
                  // Use TipTap's insertContent command which handles HTML properly
                  const editor = this.editor;
                  editor.chain().focus().insertContent(htmlContent).run();
                } else {
                  // Single paragraph or no paragraphs - use simple text insertion
                  const tr = state.tr.insertText(cleanedText);
                  view.dispatch(tr);
                }
                
                if (options.onShowToast) {
                  options.onShowToast('PDF text cleaned and formatted', 'success');
                }
              } catch (error) {
                console.error('PDF text cleaning failed:', error);
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