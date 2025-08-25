import { displayFieldValue } from "./displayFieldValue";
import { IconWithText } from "../../ui/DynamicIcon";
import { booleanToJaNei } from "../../../utils/booleanParser";
import { ExpandableRichText } from "../displayValues/ExpandableRichText";

/**
 * Displays field value with icon support for React components
 * For simple text display, use displayFieldValue instead
 */
export const displayFieldValueWithIcon_old = (field: any, row: any) => {
  // Handle statusId with icon
  if (field.name === "statusId") {
    if (row.status && row.status.navn) {
      return row.status.icon ? (
        <IconWithText iconName={row.status.icon} text={row.status.navn} iconColor={row.status.color} />
      ) : (
        <span>{row.status.navn}</span>
      );
    } else if (row.statusId) {
      return <span>Status ID: {row.statusId}</span>;
    } else {
      return <span>Ingen status</span>;
    }
  }

  // Handle emneId with icon
  if (field.name === "emneId") {
    if (row.emne && row.emne.tittel) {
      return row.emne.icon ? (
        <IconWithText iconName={row.emne.icon} text={row.emne.tittel} iconColor={row.emne.color} />
      ) : (
        <span>{row.emne.tittel}</span>
      );
    } else if (row.emneId) {
      return <span>Emne ID: {row.emneId}</span>;
    } else {
      return <span>Ingen emne</span>;
    }
  }

  // Handle vurderingId with icon
  if (field.name === "vurderingId") {
    if (row.vurdering && row.vurdering.navn) {
      return row.vurdering.icon ? (
        <IconWithText iconName={row.vurdering.icon} text={row.vurdering.navn} iconColor={row.vurdering.color} />
      ) : (
        <span>{row.vurdering.navn}</span>
      );
    } else if (row.vurderingId) {
      return <span>Vurdering ID: {row.vurderingId}</span>;
    } else {
      return <span>Ingen vurdering</span>;
    }
  }

  // Handle boolean fields with type "bool"
  if (field.type === "bool") {
    const value = row[field.name];
    return <span>{booleanToJaNei(value, "Ikke angitt")}</span>;
  }

  // For all other fields, return plain text wrapped in span
  return <span>{displayFieldValue(row, field)}</span>;
};
