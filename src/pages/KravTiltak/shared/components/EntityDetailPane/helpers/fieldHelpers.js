import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";

export const getVisibleFields = (allFields, fieldOverrides, isEditing, workspaceHiddenEdit, workspaceHiddenIndex) => {
  return allFields
    .map(field => {
      const detailOverrides = fieldOverrides[field.name] || {};
      return {
        ...field,
        detailSection: detailOverrides.section || "main",
        detailOrder: detailOverrides.order || 0,
        detailRow: detailOverrides.row || null,
      };
    })
    .filter((field) => {
      const standardHidden = isEditing ? field.hiddenEdit : false;
      const workspaceHiddenInEdit = isEditing && workspaceHiddenEdit.includes(field.name);
      const workspaceHiddenInIndex = !isEditing && workspaceHiddenIndex.includes(field.name);
      const workspaceHidden = workspaceHiddenInEdit || workspaceHiddenInIndex;
      const isExcluded = field.name === "tittel"; // Title is handled in header

      return !standardHidden && !workspaceHidden && !isExcluded;
    })
    .sort((a, b) => {
      if (a.detailOrder !== b.detailOrder) {
        return a.detailOrder - b.detailOrder;
      }
      return a.name.localeCompare(b.name);
    });
};

export const getFieldsBySection = (visibleFields) => {
  const fieldSections = {};

  visibleFields.forEach((field) => {
    const sectionName = field.detailSection || "main";
    if (!fieldSections[sectionName]) {
      fieldSections[sectionName] = [];
    }
    fieldSections[sectionName].push(field);
  });

  return fieldSections;
};

export const getFieldRowsBySection = (sectionFields) => {
  const rowGroups = {};
  const noRowFields = [];

  sectionFields.forEach((field) => {
    if (field.detailRow) {
      if (!rowGroups[field.detailRow]) {
        rowGroups[field.detailRow] = [];
      }
      rowGroups[field.detailRow].push(field);
    } else {
      noRowFields.push(field);
    }
  });

  return { rowGroups, noRowFields };
};

export const initializeFormData = (allFields, entity, modelName) => {
  const initialForm = {};
  allFields.forEach((field) => {
    const isHidden = field.hiddenEdit || field.hiddenCreate;
    const isVirtual = field.name.includes("Snippet") || field.name.includes("Plain");
    const isRelationship = ["krav", "files", "favorittTiltak", "favorittAvBrukere", "children", "parent"].includes(field.name);
    const isSystemField = ["id", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(field.name);

    if (!isHidden && !isVirtual && !isRelationship && !isSystemField) {
      const fieldValue = FieldResolver.initializeFieldValue(field, entity, true, modelName);
      initialForm[field.name] = fieldValue !== undefined ? fieldValue : entity[field.name] || "";
    }
  });
  return initialForm;
};