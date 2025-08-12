import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash } from 'lucide-react';
import SkeletonLoader from '../ui/SkeletonLoader';
import { getThemeClasses } from '../../hooks/useTheme';
import { displayFieldValue } from './utils/displayFieldValue'; // Import the utility function
import { useState } from 'react';

export default function RowList({ fields, onEdit, queryKey, queryFn, deleteFn, loadingText = 'Laster data...' }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1); // Track the current page
  const [pageSize, setPageSize] = useState(10); // Track the page size

  const { data = { items: [], totalPages: 1 }, isLoading, isError } = useQuery({
    queryKey: [...queryKey, page, pageSize], // Include page and pageSize in queryKey
    queryFn: () => {
      console.log(`RowList: Calling queryFn with page: ${page}, pageSize: ${pageSize}`);
      return queryFn(page, pageSize); // Pass page and pageSize to queryFn
    },
    select: (res) => {
      console.log('RowList: select function response:', res);
      return res?.data || { items: [], totalPages: 1 }; // Ensure default structure
    },
    refetchOnWindowFocus: true,
  });

  const mutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <SkeletonLoader cardCount={5} cardHeight={20} cardSpacing={12} />
      </div>
    );
  }

  if (isError || !data.items) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <p className="text-center text-red-500">Kunne ikke laste data. Vennligst prøv igjen senere.</p>
      </div>
    );
  }

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
          {data.items.map(row => ( // Use paginated data
            <tr key={row.id} className="hover:bg-background-muted">
              {fields.filter(f => !f.hiddenIndex).map(f => (
                <td key={f.name} className="py-2 px-3 text-sm text-text-primary">
                  {displayFieldValue(row, f)} {/* Use the imported utility function */}
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
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md disabled:opacity-50"
        >
          Forrige
        </button>
        <span>
          Side {page} av {data.totalPages}
        </span>
        <button
          onClick={() => setPage(prev => Math.min(prev + 1, data.totalPages))}
          disabled={page === data.totalPages}
          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-md disabled:opacity-50"
        >
          Neste
        </button>
      </div>
    </div>
  );
}

