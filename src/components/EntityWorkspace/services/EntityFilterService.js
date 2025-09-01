import { EntityTypeTranslator } from "../utils/entityTypeTranslator";

/**
 * EntityFilterService - Handles filtering, sorting, and data processing for entity workspaces
 * Single responsibility: Data transformation and filtering logic
 */
export class EntityFilterService {
  /**
   * Extract available filter options from entity items
   * Single responsibility: Parse and extract filter values
   */
  static extractAvailableFilters(items, entityType = null) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        statuses: [],
        vurderinger: [],
        emner: [],
        priorities: [],
      };
    }

    const filters = {
      statuses: new Set(),
      vurderinger: new Set(),
      emner: new Set(),
      priorities: new Set(),
    };

    const extractFromItems = (itemList) => {
      itemList.forEach((item) => {
        // Extract status
        this._extractFilterValue(item.status, filters.statuses);

        // Extract vurdering
        this._extractFilterValue(item.vurdering, filters.vurderinger);

        // Extract emne
        this._extractFilterValue(item.emne, filters.emner, "tittel");

        // Extract priority categories
        if (item.prioritet !== undefined && item.prioritet !== null) {
          const priorityCategory = this._categorizePriority(item.prioritet);
          filters.priorities.add(priorityCategory);
        }

        // Handle grouped data structures recursively
        this._handleGroupedData(item, entityType, extractFromItems);
      });
    };

    extractFromItems(items);

    // Convert Sets to sorted Arrays
    return {
      statuses: Array.from(filters.statuses).filter(Boolean).sort(),
      vurderinger: Array.from(filters.vurderinger).filter(Boolean).sort(),
      emner: Array.from(filters.emner).filter(Boolean).sort(),
      priorities: Array.from(filters.priorities).filter(Boolean).sort(),
    };
  }

  /**
   * Apply filters to entity items
   * Single responsibility: Filter application logic
   */
  static applyFilters(items, filters, entityType = null, groupByEmne = false) {
    if (!Array.isArray(items) || !filters || Object.keys(filters).length === 0) {
      return items;
    }

    const filterItems = (itemsList) => {
      return itemsList.filter((item) => {
        // Status filter
        if (!this._matchesFilter(item.status, filters.status)) return false;

        // Vurdering filter
        if (!this._matchesFilter(item.vurdering, filters.vurdering)) return false;

        // Priority filter
        if (!this._matchesPriorityFilter(item.prioritet, filters.priority)) return false;

        // Main obligatory/optional filter
        if (!this._matchesObligatoryFilter(item.obligatorisk, filters.filterBy)) return false;

        return true;
      });
    };

    if (groupByEmne) {
      // For grouped data, filter within each group
      return items.map((group) => {
        const newGroup = { ...group };

        // Handle different group structures
        // First try the mapped property name for this entity type
        const propertyName = this._getGroupedDataPropertyName(entityType);

        if (group[propertyName]) {
          newGroup[propertyName] = filterItems(group[propertyName]);
        } else if (group[entityType]) {
          newGroup[entityType] = filterItems(group[entityType]);
        } else if (group.entities) {
          newGroup.entities = filterItems(group.entities);
        } else if (group.krav) {
          newGroup.krav = filterItems(group.krav);
        } else if (group.tiltak) {
          newGroup.tiltak = filterItems(group.tiltak);
        } else if (group.prosjektkrav) {
          newGroup.prosjektkrav = filterItems(group.prosjektkrav);
        } else if (group.prosjekttiltak) {
          newGroup.prosjekttiltak = filterItems(group.prosjekttiltak);
        }

        return newGroup;
      });
    } else {
      // For flat data, filter directly
      return filterItems(items);
    }
  }

  /**
   * Calculate statistics from filtered items
   * Single responsibility: Statistics calculation
   */
  static calculateStats(items, entityType = null, groupByEmne = false) {
    if (!Array.isArray(items) || items.length === 0) {
      return { total: 0, obligatorisk: 0, optional: 0 };
    }

    let totalCount = 0;
    let obligatoriskCount = 0;

    const countItems = (itemsList) => {
      itemsList.forEach((item) => {
        totalCount++;
        if (item.obligatorisk === true) {
          obligatoriskCount++;
        }
      });
    };

    if (groupByEmne) {
      // For grouped data, count across all groups
      items.forEach((group) => {
        // First try the mapped property name for this entity type
        const propertyName = this._getGroupedDataPropertyName(entityType);
        if (group[propertyName]) {
          countItems(group[propertyName]);
        } else if (group[entityType]) {
          countItems(group[entityType]);
        } else if (group.entities) {
          countItems(group.entities);
        } else if (group.krav) {
          countItems(group.krav);
        } else if (group.tiltak) {
          countItems(group.tiltak);
        } else if (group.prosjektkrav) {
          countItems(group.prosjektkrav);
        } else if (group.prosjekttiltak) {
          countItems(group.prosjekttiltak);
        }
      });
    } else {
      // For flat data, count directly
      countItems(items);
    }

    return {
      total: totalCount,
      obligatorisk: obligatoriskCount,
      optional: totalCount - obligatoriskCount,
    };
  }

  // Private helper methods
  static _extractFilterValue(value, targetSet, propertyName = "navn") {
    if (!value) return;

    if (typeof value === "string") {
      targetSet.add(value);
    } else if (typeof value === "object" && value !== null) {
      const extractedValue =
        value[propertyName] || value.name || value.label || value.value || value.title || value.text || value.displayName;

      if (extractedValue && typeof extractedValue === "string") {
        targetSet.add(extractedValue);
      }
    }
  }

  static _categorizePriority(priorityValue) {
    if (priorityValue <= 2) return "høy";
    if (priorityValue === 3) return "medium";
    return "lav";
  }

  /**
   * Map entityType to the actual property name in grouped data
   */
  static _getGroupedDataPropertyName(entityType) {
    // Use centralized translator for consistent naming
    return EntityTypeTranslator.translate(entityType, "lowercase");
  }

  static _handleGroupedData(item, entityType, extractFromItems) {
    // First try the mapped property name for this entity type
    const propertyName = this._getGroupedDataPropertyName(entityType);
    if (item[propertyName]) {
      extractFromItems(item[propertyName]);
    } else if (item[entityType]) {
      extractFromItems(item[entityType]);
    } else if (item.entities) {
      extractFromItems(item.entities);
    } else if (item.krav) {
      extractFromItems(item.krav);
    } else if (item.tiltak) {
      extractFromItems(item.tiltak);
    } else if (item.prosjektkrav) {
      extractFromItems(item.prosjektkrav);
    } else if (item.prosjekttiltak) {
      extractFromItems(item.prosjekttiltak);
    }
  }

  static _matchesFilter(itemValue, filterValue) {
    if (!filterValue || filterValue === "all") return true;

    let itemFilterValue;
    if (typeof itemValue === "string") {
      itemFilterValue = itemValue;
    } else if (typeof itemValue === "object" && itemValue !== null) {
      itemFilterValue =
        itemValue.navn ||
        itemValue.name ||
        itemValue.label ||
        itemValue.value ||
        itemValue.title ||
        itemValue.text ||
        itemValue.displayName;
    }

    return itemFilterValue === filterValue;
  }

  static _matchesPriorityFilter(priorityValue, filterValue) {
    if (!filterValue || filterValue === "all") return true;

    if (priorityValue === undefined || priorityValue === null) {
      return filterValue === "all";
    }

    const priorityCategory = this._categorizePriority(priorityValue);
    return priorityCategory === filterValue;
  }

  static _matchesObligatoryFilter(obligatorisk, filterBy) {
    if (!filterBy || filterBy === "all") return true;

    if (filterBy === "obligatorisk") {
      return obligatorisk === true;
    } else if (filterBy === "optional") {
      return obligatorisk === false || obligatorisk === null || obligatorisk === undefined;
    }

    return true;
  }
}

export default EntityFilterService;
