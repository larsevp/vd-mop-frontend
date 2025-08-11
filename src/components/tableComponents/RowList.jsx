import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash } from 'lucide-react';
import { getThemeClasses } from '../../hooks/useTheme';

export default function RowList({ fields, onEdit, queryKey, queryFn, deleteFn, loadingText = 'Laster data...' }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn,
    select: res => res.data || [],
    refetchOnWindowFocus: true
  });
  const mutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey })
  });

  // Helper function to display field values, especially for foreign keys
  const displayFieldValue = (row, field) => {
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

  if (isLoading) return null;
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            {fields.filter(f => !f.hiddenIndex).map(f => (
              <th key={f.name} className="py-2 px-3 text-left text-sm font-semibold text-neutral-900">{f.label}</th>
            ))}
            <th className="py-2 px-3 text-right text-sm font-semibold text-text-primary">Handlinger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-muted bg-background-primary">
          {data.map(row => (
            <tr key={row.id} className="hover:bg-background-muted">
              {fields.filter(f => !f.hiddenIndex).map(f => (
                <td key={f.name} className="py-2 px-3 text-sm text-text-primary">
                  {displayFieldValue(row, f)}
                </td>
              ))}
              <td className="py-2 px-3 text-right flex gap-2 justify-end">
                <button
                  className={`inline-flex items-center justify-center w-8 h-8 ${getThemeClasses.button.secondary} rounded-md border transition-all shadow-sm hover:shadow`}
                  onClick={() => onEdit(row)}
                  title="Rediger"
                >
                  <Pencil size={16} />
                </button>
                {deleteFn && (
                  <button
                    className={`inline-flex items-center justify-center w-8 h-8 bg-background-muted text-error-600 hover:bg-error-50 hover:text-error-700 rounded-md border border-border-muted hover:border-error-300 transition-all shadow-sm hover:shadow`}
                    onClick={() => mutation.mutate(row.id)}
                    title="Slett"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
