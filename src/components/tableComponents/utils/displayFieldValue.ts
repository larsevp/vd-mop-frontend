export const displayFieldValue = (row: any, field: any): string => {
  const value = row[field.name];

  // Handle enhetId specially - show the related enhet name if available
  if (field.name === 'enhetId') {
    if (row.enhet && row.enhet.navn) {
      return row.enhet.navn;
    } else if (value) {
      return `Enhet ID: ${value}`; // Fallback to showing the ID if name not available
    } else {
      return 'Ingen enhet'; // No enhet assigned
    }
  }

  // Handle User foreign keys
  if (field.name === 'createdBy') {
    if (row.creator && row.creator.navn) {
      return row.creator.navn;
    } else if (value) {
      return `User ID: ${value}`;
    } else {
      return 'System';
    }
  }

  if (field.name === 'updatedBy') {
    if (row.updater && row.updater.navn) {
      return row.updater.navn;
    } else if (value) {
      return `User ID: ${value}`;
    } else {
      return 'Ingen oppdateringer';
    }
  }

  // Handle Emne foreign keys
  if (field.name === 'emneId') {
    if (row.emne && (row.emne.tittel || row.emne.navn)) {
      return row.emne.tittel || row.emne.navn;
    } else if (value) {
      return `Emne ID: ${value}`;
    } else {
      return 'Ingen emne';
    }
  }

  // Handle other foreign key fields that might have relationships
  // You can add more cases here as needed

  // Default: return the raw value, or 'N/A' if null/undefined
  return value !== null && value !== undefined ? value : 'N/A';
};
