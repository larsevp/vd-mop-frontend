import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash } from 'lucide-react';

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

  if (isLoading) return null;
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            {fields.filter(f => !f.hiddenIndex).map(f => (
              <th key={f.name} className="py-2 px-3 text-left text-sm font-semibold text-neutral-900">{f.label}</th>
            ))}
            <th className="py-2 px-3 text-right text-sm font-semibold text-neutral-900">Handlinger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {data.map(row => (
            <tr key={row.id} className="hover:bg-neutral-50">
              {fields.filter(f => !f.hiddenIndex).map(f => (
                <td key={f.name} className="py-2 px-3 text-sm text-neutral-900">{row[f.name]}</td>
              ))}
              <td className="py-2 px-3 text-right flex gap-2 justify-end">
                <button
                  className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-md border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow"
                  onClick={() => onEdit(row)}
                  title="Rediger"
                >
                  <Pencil size={16} />
                </button>
                {deleteFn && (
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md border border-gray-200 hover:border-red-300 transition-all shadow-sm hover:shadow"
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
