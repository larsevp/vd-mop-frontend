/**
 * List Recognition Module for Rich Text Editor
 *
 * Detects and converts pasted text containing bullet points or numbered lists
 * into structured list data for TipTap/ProseMirror.
 *
 * Patterns supported:
 * - Bullet lists: •, -, * followed by space
 * - Numbered lists: 1., 2., 3. followed by space
 * - Multi-line items (continuation lines without markers)
 */

/**
 * Detect if a line starts with a list marker
 * @param {string} line - Line of text to check
 * @returns {Object|null} - { type: 'bullet'|'ordered', marker: string, content: string } or null
 */
export function detectListMarker(line) {
  const trimmed = line.trimStart();

  // Bullet list markers: •, -, *
  const bulletMatch = trimmed.match(/^([•\-*])\s+(.+)/);
  if (bulletMatch) {
    return {
      type: 'bullet',
      marker: bulletMatch[1],
      content: bulletMatch[2].trim(),
      indent: line.length - trimmed.length
    };
  }

  // Numbered list markers: 1., 2., 3., etc.
  const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
  if (numberedMatch) {
    return {
      type: 'ordered',
      marker: numberedMatch[1],
      content: numberedMatch[2].trim(),
      indent: line.length - trimmed.length
    };
  }

  return null;
}

/**
 * Check if a line is a continuation of a previous list item
 * (no marker, but appears to be part of multi-line item)
 * @param {string} line - Line to check
 * @param {boolean} inList - Whether we're currently processing a list
 * @returns {boolean}
 */
function isContinuationLine(line, inList) {
  if (!inList) return false;
  if (!line.trim()) return false; // Empty lines break continuation

  // If line has no marker and we're in a list, it's a continuation
  return detectListMarker(line) === null;
}

/**
 * Pre-process text to split inline bullets back into separate lines
 * This handles cases where PDF cleaner merged list items into one paragraph
 * @param {string} text - Text that may contain inline bullets
 * @returns {string} - Text with bullets split into separate lines
 */
function splitInlineBullets(text) {
  // Step 1: Split on bullets that appear in merged text
  // Pattern: any non-newline character followed by space, bullet, and space
  // Example: "krom til • Utvendig kledning • Rør"
  let result = text.replace(/([^\n])\s+([•\-*])\s+/g, '$1\n$2 ');

  // Step 2: Detect paragraph AFTER LAST BULLET by looking for:
  // Last list item line (starts with bullet) followed by text starting with capital
  // Pattern: line starting with bullet marker, ending with lowercase/punctuation,
  // then capital word on what should be next paragraph
  // Example: "• dokumentere ... valgt bort Dersom det er behov"
  // ONLY applies to lines that start with bullets (not normal text)
  const paragraphStarters = /\b(Dersom|Det|Dette|Disse|Følgende|For|Ved|Alle|Ingen|Hvis|Når|En|Et)\b/;

  // Split lines for processing
  const lines = result.split('\n');
  const processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts with a bullet marker (it's a list item)
    if (/^[•\-*]\s/.test(line.trim())) {
      // Check if there's text after the list item that looks like a new paragraph
      const match = line.match(new RegExp(`^([•\\-*]\\s.+[a-zæøå.,;!?])\\s+(${paragraphStarters.source}.*)$`));
      if (match) {
        // Split this list item from the paragraph that follows
        processedLines.push(match[1]); // The list item part
        processedLines.push(''); // Empty line for paragraph separation
        processedLines.push(match[2]); // The paragraph part
      } else {
        processedLines.push(line);
      }
    } else {
      processedLines.push(line);
    }
  }

  return processedLines.join('\n');
}

/**
 * Parse text into structured blocks (paragraphs and lists)
 * @param {string} text - Cleaned text from pdfTextCleaner
 * @returns {Object} - { blocks: [{ type, content/items }] }
 */
export function convertToListStructure(text) {
  if (!text || !text.trim()) {
    return { blocks: [] };
  }

  // Pre-process: split inline bullets back into lines
  const preprocessed = splitInlineBullets(text);

  const lines = preprocessed.split('\n');
  const blocks = [];
  let currentBlock = null;
  let currentListItem = null;

  const finishCurrentBlock = () => {
    if (!currentBlock) return;

    // Finish current list item if exists
    if (currentListItem && currentBlock.type !== 'paragraph') {
      currentBlock.items.push(currentListItem.content.trim());
      currentListItem = null;
    }

    // Add block to results if it has content
    if (currentBlock.type === 'paragraph' && currentBlock.content.trim()) {
      blocks.push(currentBlock);
    } else if (currentBlock.items && currentBlock.items.length > 0) {
      blocks.push(currentBlock);
    }

    currentBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = detectListMarker(line);

    // Empty line - finish current block
    if (!line.trim()) {
      finishCurrentBlock();
      continue;
    }

    // Line has a list marker
    if (marker) {
      // If switching from paragraph or different list type, finish current block
      if (currentBlock &&
          (currentBlock.type === 'paragraph' ||
           (currentBlock.type === 'bulletList' && marker.type === 'ordered') ||
           (currentBlock.type === 'orderedList' && marker.type === 'bullet'))) {
        finishCurrentBlock();
      }

      // Finish previous list item
      if (currentListItem) {
        currentBlock.items.push(currentListItem.content.trim());
      }

      // Start new list block if needed
      if (!currentBlock) {
        currentBlock = {
          type: marker.type === 'bullet' ? 'bulletList' : 'orderedList',
          items: []
        };
      }

      // Start new list item
      currentListItem = {
        content: marker.content
      };
    }
    // Continuation line (part of multi-line list item)
    else if (isContinuationLine(line, currentBlock && currentBlock.type !== 'paragraph')) {
      if (currentListItem) {
        // Add to current list item with a space
        currentListItem.content += ' ' + line.trim();
      } else {
        // Orphaned continuation line - treat as paragraph
        finishCurrentBlock();
        currentBlock = {
          type: 'paragraph',
          content: line.trim()
        };
      }
    }
    // Regular paragraph line
    else {
      finishCurrentBlock();

      if (currentBlock && currentBlock.type === 'paragraph') {
        // Add to existing paragraph with newline
        currentBlock.content += '\n' + line;
      } else {
        // Start new paragraph block
        currentBlock = {
          type: 'paragraph',
          content: line
        };
      }
    }
  }

  // Finish any remaining block
  finishCurrentBlock();

  return { blocks };
}

/**
 * Check if text contains any list patterns
 * Quick check before doing full parsing
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export function hasListPatterns(text) {
  if (!text) return false;

  // Check for bullet markers at start of lines OR after line breaks in merged text
  const bulletPattern = /^[\s]*[•\-*]\s+/m;
  if (bulletPattern.test(text)) return true;

  // Check for bullets in middle of text (after PDF cleaning merged lines)
  // Pattern: space + bullet + space (bullets appearing anywhere in merged text)
  const inlineBulletPattern = /\s+[•\-*]\s+/;
  if (inlineBulletPattern.test(text)) return true;

  // Check for numbered markers at start of lines
  const numberedPattern = /^[\s]*\d+\.\s+/m;
  if (numberedPattern.test(text)) return true;

  return false;
}

