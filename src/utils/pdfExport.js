/**
 * PDF Export Utility
 *
 * Provides functions to export HTML content to PDF files
 */

import html2pdf from 'html2pdf.js';

/**
 * Export article view content to PDF
 *
 * @param {string} containerId - ID of the container element to export
 * @param {string} filename - Name for the PDF file (without .pdf extension)
 * @param {Object} options - Optional configuration
 */
export const exportArticleViewToPDF = async (containerId = 'article-view-container', filename = 'artikkelvisning', options = {}) => {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Element with ID "${containerId}" not found`);
    return;
  }

  // Find the EntityListPane container (div.h-full.flex.flex-col.bg-white)
  const listPane = container.querySelector('.h-full.flex.flex-col.bg-white');

  if (!listPane) {
    console.error('Could not find EntityListPane container');
    return;
  }

  // Clone the list pane
  const clone = listPane.cloneNode(true);

  // Remove the RowListHeading (first child - the .print-hide div)
  const heading = clone.querySelector('.print-hide');
  if (heading) {
    heading.remove();
  }

  // Remove all buttons from the clone
  const buttons = clone.querySelectorAll('button');
  buttons.forEach(btn => btn.remove());

  // Remove gradient overlays (from FlexScrollableContainer) - more specific selector
  const gradients = clone.querySelectorAll('[class*="bg-gradient-to"]');
  gradients.forEach(grad => {
    // Check if this element is just a gradient overlay (has pointer-events-none)
    if (grad.classList.contains('pointer-events-none')) {
      grad.remove();
    }
  });

  // Create a wrapper div for proper PDF styling
  const wrapper = document.createElement('div');
  wrapper.style.width = '210mm'; // A4 width
  wrapper.style.padding = '0';
  wrapper.style.backgroundColor = 'white';

  // Get the content from FlexScrollableContainer's inner div
  const scrollContent = clone.querySelector('.flex-1');
  if (scrollContent) {
    // Remove scrolling classes and fix heights
    scrollContent.classList.remove('flex-1', 'overflow-y-auto', 'overflow-auto');
    scrollContent.style.overflow = 'visible';
    scrollContent.style.height = 'auto';
    scrollContent.style.maxHeight = 'none';

    wrapper.appendChild(scrollContent);
  } else {
    wrapper.appendChild(clone);
  }

  // Fix all remaining height constraints
  const allElements = wrapper.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove flex-1 which causes height issues
    el.classList.remove('flex-1');

    // Remove inline height styles that cause truncation
    const inlineHeight = el.style.height;
    if (inlineHeight && (inlineHeight.includes('vh') || inlineHeight.includes('calc'))) {
      el.style.height = 'auto';
    }

    // Ensure overflow is visible
    if (el.style.overflow === 'hidden' || el.style.overflow === 'scroll' || el.style.overflow === 'auto') {
      el.style.overflow = 'visible';
    }
  });

  // Default PDF options
  const defaultOptions = {
    margin: [10, 10, 10, 10], // top, right, bottom, left in mm
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };

  // Merge with custom options
  const pdfOptions = { ...defaultOptions, ...options };

  try {
    // Generate and download PDF from the wrapper element
    await html2pdf().set(pdfOptions).from(wrapper).save();
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};

/**
 * Export a specific element to PDF
 *
 * @param {HTMLElement} element - The DOM element to export
 * @param {string} filename - Name for the PDF file
 * @param {Object} options - Optional configuration
 */
export const exportElementToPDF = async (element, filename = 'export', options = {}) => {
  if (!element) {
    console.error('Element is required');
    return;
  }

  const defaultOptions = {
    margin: [10, 10, 10, 10],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };

  const pdfOptions = { ...defaultOptions, ...options };

  try {
    await html2pdf().set(pdfOptions).from(element).save();
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};
