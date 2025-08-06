import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  onClick={() => onEdit(row)}
                >
                  Rediger
                </button>
                {deleteFn && (
                  <button
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                    onClick={() => mutation.mutate(row.id)}
                  >
                    Slett
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
