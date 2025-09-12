import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Keyboard Shortcuts Extension for TipTap
 * 
 * Handles:
 * - Escape key for focus management
 * - Ctrl+K for link creation
 * - Other custom keyboard shortcuts
 * 
 * This is the Safari-safe way to implement keyboard handling in TipTap
 */
export const KeyboardShortcutsExtension = Extension.create({
  name: 'keyboardShortcuts',

  addOptions() {
    return {
      disabled: false,
    };
  },

  addKeyboardShortcuts() {
    return {
      // Escape key handling - focus management
      'Escape': () => {
        if (this.options.disabled) return false;
        
        try {
          const { view } = this.editor;
          if (!view || !view.dom) return false;

          // Blur the editor to focus out
          view.dom.blur();

          // Find the next focusable element and focus it
          const editorElement = view.dom.closest('.tiptap-editor, [data-tiptap-editor]') || view.dom;
          const form = editorElement.closest('form') || document;
          const focusableElements = form.querySelectorAll(
            'input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]):not([type="button"]), [tabindex]:not([tabindex="-1"]):not([disabled])'
          );

          const currentIndex = Array.from(focusableElements).findIndex(
            (el) => el === editorElement || el.contains(editorElement) || editorElement.contains(el)
          );

          // Focus the next element after the editor
          if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
            focusableElements[currentIndex + 1].focus();
          }

          return true; // Event handled
        } catch (error) {
          console.debug('Escape key handling error:', error);
          return false;
        }
      },

      // Ctrl+K for link creation
      'Mod-k': () => {
        if (this.options.disabled) return false;
        
        try {
          const url = window.prompt('Enter full URL (including http:// or https://):');
          if (url) {
            // Ensure URL starts with protocol
            const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
            
            // Apply link to selection or insert link
            if (this.editor.state.selection.empty) {
              // No selection, insert link with URL as text
              this.editor.chain().focus().insertContent(`<a href="${fullUrl}">${fullUrl}</a>`).run();
            } else {
              // Has selection, make it a link
              this.editor.chain().focus().setLink({ href: fullUrl }).run();
            }
          }
          return true;
        } catch (error) {
          console.debug('Link creation error:', error);
          return false;
        }
      },

      // Ctrl+Shift+K to remove link
      'Mod-Shift-k': () => {
        if (this.options.disabled) return false;
        
        try {
          this.editor.chain().focus().unsetLink().run();
          return true;
        } catch (error) {
          console.debug('Link removal error:', error);
          return false;
        }
      },

      // Ctrl+B for bold
      'Mod-b': () => {
        if (this.options.disabled) return false;
        
        try {
          this.editor.chain().focus().toggleBold().run();
          return true;
        } catch (error) {
          console.debug('Bold toggle error:', error);
          return false;
        }
      },

      // Ctrl+I for italic
      'Mod-i': () => {
        if (this.options.disabled) return false;
        
        try {
          this.editor.chain().focus().toggleItalic().run();
          return true;
        } catch (error) {
          console.debug('Italic toggle error:', error);
          return false;
        }
      },

      // Ctrl+U for underline
      'Mod-u': () => {
        if (this.options.disabled) return false;
        
        try {
          this.editor.chain().focus().toggleUnderline().run();
          return true;
        } catch (error) {
          console.debug('Underline toggle error:', error);
          return false;
        }
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('keyboardShortcuts'),
        props: {
          // Additional keyboard handling that can't be done via addKeyboardShortcuts
          handleKeyDown: (view, event) => {
            // Handle other special cases if needed
            // This runs alongside the keyboard shortcuts defined above
            
            // Example: Prevent form submission on Enter in certain contexts
            if (event.key === 'Enter' && event.ctrlKey) {
              // Could handle Ctrl+Enter for form submission
              // For now, let TipTap handle it normally
              return false;
            }

            // Let other handlers process the event
            return false;
          }
        }
      })
    ];
  }
});