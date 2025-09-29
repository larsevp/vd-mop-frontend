/**
 * PDF Text Cleaning Algorithm
 *
 * This module provides intelligent cleaning of PDF-extracted text by removing
 * artificial line breaks while preserving intentional paragraph boundaries.
 *
 * The algorithm uses statistical analysis of line lengths to distinguish between:
 * - Artificial breaks: Line breaks inserted by PDF rendering that split sentences
 * - Intentional breaks: Actual paragraph boundaries meant by the author
 */

/**
 * Analyzes line lengths to determine typical formatting patterns
 * @param {string[]} lines - Array of text lines
 * @returns {Object} Analysis results with target length and statistics
 */
const analyzeLinePatterns = (lines) => {
  if (lines.length === 0) {
    return { targetLength: 80, tolerance: 2, stats: { max: 0, avg: 0, count: 0 } };
  }

  const lineLengths = lines.map((line) => line.length);
  const maxLineLength = Math.max(...lineLengths);
  const avgLineLength = lineLengths.reduce((sum, len) => sum + len, 0) / lineLengths.length;

  // Use 85th percentile as target - this captures the typical full line length
  // while avoiding extreme outliers (very short lines or unusually long ones)
  const sortedLengths = [...lineLengths].sort((a, b) => b - a);
  const targetLineLength = sortedLengths[Math.floor(sortedLengths.length * 0.15)];

  // Adaptive tolerance based on variance in line lengths
  const variance = lineLengths.reduce((sum, len) => sum + Math.pow(len - avgLineLength, 2), 0) / lineLengths.length;
  const tolerance = Math.max(2, Math.min(10, Math.sqrt(variance) * 0.1));

  return {
    targetLength: maxLineLength, // Use actual max length, not percentile
    tolerance: Math.round(tolerance),
    stats: {
      max: maxLineLength,
      avg: Math.round(avgLineLength),
      count: lines.length,
      variance: Math.round(variance),
    },
  };
};

/**
 * Detects if a line break appears to be artificial based on context
 * @param {string} currentLine - The current accumulated line
 * @param {string} nextLine - The next line to potentially merge
 * @param {number} targetLength - Expected typical line length
 * @param {number} tolerance - Acceptable variance from target length
 * @returns {boolean} True if the break should be preserved, false if it should be removed
 */
const shouldPreserveBreak = (currentLine, nextLine, targetLength, tolerance) => {
  if (!nextLine) return true; // Always preserve breaks at end of text

  // Step 1: Find max line length (this should be passed in, but using targetLength as proxy)
  const maxLength = targetLength;

  // Step 2: Calculate current line length + first word of next line
  const nextLineTrimmed = nextLine.trim();
  const nextWords = nextLineTrimmed.split(/\s+/);
  const nextWord = nextWords[0] || "";
  const currentPlusNextWord = currentLine.length + 1 + nextWord.length;

  // Step 3: If current.length > (max.length - 3) then merge
  if (currentPlusNextWord > maxLength - 3) {
    return false; // Merge - this is an artificial break
  }

  // Step 4: If not over limit, run paragraph test

  // Paragraph test: Does current line end with period?
  const endsWithPeriod = /[.!?]$/.test(currentLine.trim());
  if (endsWithPeriod) {
    return true; // New paragraph
  } else {
    return false; // Continue same paragraph
  }
};

/**
 * Processes lines to remove artificial breaks while preserving paragraph structure
 * @param {string[]} lines - Input lines
 * @param {number} maxLength - Maximum line length from analysis
 * @param {number} tolerance - Tolerance (not used in simple logic)
 * @returns {string[]} Processed lines with artificial breaks removed
 */
const processArtificialBreaks = (lines, maxLength, tolerance) => {
  // First, map lines to decisions: should we preserve the break AFTER each line?
  const breakDecisions = [];

  for (let i = 0; i < lines.length - 1; i++) {
    // -1 because last line has no break after it
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    // Calculate: current line length + space + first word of next line
    const nextWords = nextLine.trim().split(/\s+/);
    const nextWord = nextWords[0] || "";
    const combinedLength = currentLine.length + 1 + nextWord.length;

    // Step 1: If combined > (max - 3), then merge (artificial break)
    if (combinedLength > maxLength - 3) {
      breakDecisions.push(false); // Don't preserve break = merge
    } else {
      // Step 2: Check if current line ends with period
      const endsWithPeriod = /[.!?]$/.test(currentLine.trim());
      if (endsWithPeriod) {
        breakDecisions.push(true); // Preserve break = new paragraph
      } else {
        breakDecisions.push(false); // Don't preserve break = merge
      }
    }
  }

  // Now build the result based on break decisions
  const result = [];
  let currentMergedLine = lines[0]; // Start with first line

  for (let i = 0; i < breakDecisions.length; i++) {
    const shouldPreserveBreak = breakDecisions[i];
    const nextLine = lines[i + 1];

    if (shouldPreserveBreak) {
      // Preserve break - finish current line and start new one
      result.push(currentMergedLine);
      currentMergedLine = nextLine;
    } else {
      // Merge - add next line to current
      currentMergedLine += " " + nextLine;
    }
  }

  // Add the final line
  result.push(currentMergedLine);

  return result;
};

/**
 * Groups processed lines into logical paragraphs
 * @param {string[]} lines - Processed lines
 * @param {number} targetLength - Target line length for consistency checks
 * @param {number} tolerance - Tolerance for length variance
 * @returns {string[]} Array of paragraph strings
 */
const groupIntoParagraphs = (lines, targetLength, tolerance) => {
  const paragraphs = [];
  let currentParagraph = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];

    currentParagraph.push(line);

    // Detect paragraph boundaries - but be more conservative than before
    const endsWithSentence = /[.!?]$/.test(line.trim());
    const nextStartsWithCapital = nextLine && /^[A-ZÆØÅ]/.test(nextLine);
    const nextLooksLikeNewParagraph = nextLine && (/^\d+\.?\s/.test(nextLine) || /^[-•*]\s/.test(nextLine));

    // Check if combining would exceed reasonable length
    const combinedLength = currentParagraph.join(" ").length + (nextLine ? nextLine.length + 1 : 0);
    const wouldBeTooLong = combinedLength > (targetLength + tolerance) * 2; // Allow longer paragraphs

    // Only break into new paragraph for strong indicators
    if (nextLooksLikeNewParagraph || !nextLine || wouldBeTooLong) {
      paragraphs.push(currentParagraph.join(" "));
      currentParagraph = [];
    } else if (endsWithSentence && nextStartsWithCapital) {
      // For sentence boundaries, check if we should really break
      // Only break if the current paragraph is already quite substantial
      const currentParagraphLength = currentParagraph.join(" ").length;
      if (currentParagraphLength > (targetLength + tolerance) * 1.5) {
        paragraphs.push(currentParagraph.join(" "));
        currentParagraph = [];
      } else {
        // Continue the paragraph
      }
    }
  }

  // Add any remaining paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  return paragraphs;
};

/**
 * Determines if text looks like it came from a PDF and would benefit from cleaning
 * @param {string} text - The text to analyze
 * @returns {boolean} True if text appears to be PDF-like and should be cleaned
 */
const shouldCleanText = (text) => {
  if (!text || text.length < 50) return false;

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  
  if (lines.length < 3) return false;

  // Check for indicators this is structured content that shouldn't be cleaned
  const hasTabsInMultipleLines = lines.filter((line) => line.includes("\t")).length > 1;
  const looksLikeCode = /^\s*(function|class|def|import|#include|\{|\}|\/\/|\/\*)/m.test(text);
  const looksLikeJSON = text.trim().startsWith("{") && text.trim().endsWith("}");
  const looksLikeHTML = /<[^>]+>/.test(text);

  if (hasTabsInMultipleLines || looksLikeCode || looksLikeJSON || looksLikeHTML) {
    return false;
  }

  // Check for PDF-like characteristics
  const lineLengths = lines.map((line) => line.length);
  const avgLength = lineLengths.reduce((sum, len) => sum + len, 0) / lineLengths.length;
  const hasConsistentLengths = lineLengths.filter((len) => Math.abs(len - avgLength) < avgLength * 0.3).length > lines.length * 0.6;
  const hasMidSentenceBreaks = lines.some((line, i) => {
    const nextLine = lines[i + 1];
    return nextLine && !line.match(/[.!?]$/) && nextLine.match(/^[a-z]/);
  });

  return hasConsistentLengths || hasMidSentenceBreaks;
};

/**
 * Main function to clean PDF-extracted text
 * @param {string} text - Raw text from PDF paste
 * @param {boolean} force - Force cleaning even if shouldCleanText returns false
 * @returns {string} Cleaned text with proper paragraph structure
 */
export const cleanPDFText = (text, force = false) => {
  // First check if this text should be cleaned at all
  const shouldClean = force || shouldCleanText(text);

  if (!shouldClean) {
    return text;
  }

  // Split into lines and filter empty ones
  const allLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (allLines.length === 0) return text;

  // Analyze line patterns to understand the formatting
  const analysis = analyzeLinePatterns(allLines);

  // Process artificial breaks
  const processedLines = processArtificialBreaks(allLines, analysis.targetLength, analysis.tolerance);

  // Group into paragraphs
  const paragraphs = groupIntoParagraphs(processedLines, analysis.targetLength, analysis.tolerance);

  const result = paragraphs.join("\n\n");

  return result;
};

/**
 * Potential failure modes and mitigation strategies:
 *
 * 1. EDGE CASE: Very short text (< 3 lines)
 *    - Risk: Statistical analysis becomes meaningless
 *    - Mitigation: Use conservative defaults, minimal processing
 *
 * 2. EDGE CASE: Uniform line lengths (tables, code, poetry)
 *    - Risk: Algorithm assumes all breaks are artificial
 *    - Mitigation: Detect patterns (equal lengths, special characters)
 *
 * 3. EDGE CASE: Mixed languages with different capitalization rules
 *    - Risk: Incorrect paragraph detection
 *    - Mitigation: More robust sentence ending detection
 *
 * 4. EDGE CASE: Technical documents with abbreviations
 *    - Risk: "Dr. Smith" treated as paragraph break
 *    - Mitigation: Common abbreviation detection
 *
 * 5. EDGE CASE: Lists and numbered items
 *    - Risk: List items merged incorrectly
 *    - Mitigation: Detect list patterns (numbers, bullets)
 *
 * 6. EDGE CASE: Very inconsistent formatting
 *    - Risk: Target length calculation is wrong
 *    - Mitigation: Use multiple statistical measures, adaptive tolerance
 *
 * 7. PERFORMANCE: Very large texts
 *    - Risk: Slow processing, memory issues
 *    - Mitigation: Chunked processing for large texts
 *
 * 8. EDGE CASE: Texts with intentional short lines (poetry, quotes)
 *    - Risk: Short lines incorrectly merged
 *    - Mitigation: Detect poetic patterns, preserve structure
 */
