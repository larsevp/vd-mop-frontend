/**
 * Keyboard handler functions for TipTap editor
 */
export const createKeyboardHandler = (editor, disabled = false) => {
  return (view, event) => {
    // If no editor passed, this is likely being called during initialization
    // We'll work directly with the view for basic operations
    if (!editor && !view) return false;

    // Handle Escape key to focus out of editor (prevent form-level Esc handling)
    if (event.key === "Escape" && !disabled) {
      event.preventDefault();
      event.stopPropagation(); // Prevent bubbling to form-level Esc handler
      
      // Blur the editor to focus out
      if (editor && editor.view && editor.view.dom) {
        editor.view.dom.blur();
        
        // Find the next focusable element and focus it
        const editorElement = editor.view.dom.closest('.tiptap-editor, [data-tiptap-editor]') || editor.view.dom;
        const form = editorElement.closest('form') || document;
        const focusableElements = form.querySelectorAll(
          'input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]):not([type="button"]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        
        const currentIndex = Array.from(focusableElements).findIndex(el => 
          el === editorElement || el.contains(editorElement) || editorElement.contains(el)
        );
        
        // Focus the next element after the editor
        if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
          focusableElements[currentIndex + 1].focus();
        }
      }
      
      return true; // Event handled
    }

    // Handle Ctrl+K for link creation
    if (event.key === "k" && (event.ctrlKey || event.metaKey) && !disabled) {
      event.preventDefault();
      if (editor) {
        const url = window.prompt("Enter full URL (including http:// or https://):");
        if (url) {
          const fullUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
          editor.chain().focus().extendMarkRange("link").setLink({ href: fullUrl }).run();
        }
      }
      return true;
    }

    // Handle Tab key for proper indentation and table navigation
    if (event.key === "Tab" && !disabled) {
      if (editor) {
        const isInTable = editor.isActive("table");
        const isInList = editor.isActive("listItem");
        const hasContent = !editor.isEmpty;
        const shouldHandleTab = isInTable || isInList || (hasContent && editor.isFocused);

        if (shouldHandleTab) {
          event.preventDefault();

          if (isInTable) {
            // In table: Tab moves to next cell, Shift+Tab moves to previous cell
            if (event.shiftKey) {
              editor.chain().focus().goToPreviousCell().run();
            } else {
              editor.chain().focus().goToNextCell().run();
            }
          } else if (event.shiftKey) {
            // Shift+Tab: outdent or lift list item
            if (isInList) {
              editor.chain().focus().liftListItem("listItem").run();
            }
          } else {
            // Tab: indent or sink list item, otherwise insert tab spaces
            if (isInList) {
              editor.chain().focus().sinkListItem("listItem").run();
            } else {
              // Insert 4 spaces as tab equivalent
              editor.chain().focus().insertContent("    ").run();
            }
          }
          return true;
        }
      }
      // If not handling tab, let browser handle normal tab navigation
      return false;
    }

    // Handle Delete key for table deletion - only with Ctrl/Cmd modifier
    if ((event.key === "Delete" || event.key === "Backspace") && (event.ctrlKey || event.metaKey) && !disabled) {
      if (editor && editor.isActive("table")) {
        const shouldDelete = window.confirm("Delete the entire table?");
        if (shouldDelete) {
          event.preventDefault();
          editor.chain().focus().deleteTable().run();
          return true;
        }
      }
    }

    // Handle Enter key to create lists from patterns
    if (event.key === "Enter" && !disabled && editor) {
      const { from, to } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 10), from); // Check for "- " or "* " at start of line to create bullet list
      if (textBefore.match(/^- $/) || textBefore.match(/^\* $/)) {
        event.preventDefault();
        // Remove the "- " or "* " and create a bullet list
        editor
          .chain()
          .focus()
          .deleteRange({ from: from - 2, to: from })
          .toggleBulletList()
          .run();
        return true;
      }

      // Check for "1. " or "1) " at start of line to create numbered list
      const dotPattern = textBefore.match(/(\d+)\. $/);
      const parenPattern = textBefore.match(/(\d+)\) $/);

      if (dotPattern) {
        event.preventDefault();
        const fullMatch = dotPattern[0];
        editor
          .chain()
          .focus()
          .deleteRange({ from: from - fullMatch.length, to: from })
          .toggleOrderedList()
          .run();
        return true;
      }

      if (parenPattern) {
        event.preventDefault();
        const fullMatch = parenPattern[0];
        editor
          .chain()
          .focus()
          .deleteRange({ from: from - fullMatch.length, to: from })
          .toggleOrderedList()
          .run();
        return true;
      }
    }

    return false;
  };
};
