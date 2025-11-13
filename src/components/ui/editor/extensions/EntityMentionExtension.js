import { Mention } from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from '../components/MentionList';

/**
 * EntityMentionExtension - Custom mention extension for entity references
 *
 * Allows users to insert references to other entities by typing @ or clicking toolbar button.
 * Shows autocomplete dropdown with entity search/filter.
 * Renders mentions as badges with UID: Title format (e.g., "K-001: Sikkerhetsrutiner")
 */

export const EntityMention = Mention.extend({
  name: 'entityMention',

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: 'entity-mention',
      },
      renderLabel({ options, node }) {
        return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
      },
      suggestion: {
        char: '@',
        allowSpaces: true,

        items: ({ query, editor }) => {
          // Access entities from editor storage (set by TiptapEditor component)
          const entities = editor.storage.entityMention?.entities || [];

          if (!query) {
            // Return all entities if no query, limited to 10
            return entities.slice(0, 10);
          }

          // Filter entities by UID and title
          const searchTerm = query.toLowerCase();
          return entities
            .filter(entity => {
              const uid = entity.uid || entity.kravUID || entity.tiltakUID || '';
              const title = entity.tittel || '';
              const searchText = `${uid} ${title}`.toLowerCase();
              return searchText.includes(searchTerm);
            })
            .slice(0, 10);
        },

        render: () => {
          let component;
          let popup;

          return {
            onStart: props => {
              component = new ReactRenderer(MentionList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                maxWidth: 'none',
              });
            },

            onUpdate(props) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              return component.ref?.onKeyDown(props);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return { 'data-id': attributes.id };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {};
          }
          return { 'data-label': attributes.label };
        },
      },
      uid: {
        default: null,
        parseHTML: element => element.getAttribute('data-uid'),
        renderHTML: attributes => {
          if (!attributes.uid) {
            return {};
          }
          return { 'data-uid': attributes.uid };
        },
      },
      entityType: {
        default: null,
        parseHTML: element => element.getAttribute('data-entity-type'),
        renderHTML: attributes => {
          if (!attributes.entityType) {
            return {};
          }
          return { 'data-entity-type': attributes.entityType };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        'data-type': this.name,
        class: 'entity-mention',
      },
      this.options.renderLabel({
        options: this.options,
        node,
      }),
    ];
  },

  renderText({ node }) {
    return this.options.renderLabel({
      options: this.options,
      node,
    });
  },
});
