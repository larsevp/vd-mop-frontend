
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function RowForm({ fields, row, onSuccess, onCancel, createFn, updateFn, queryKey, modelPrintName = 'rad' }) {
  const editing = !!(row && row.id);
  const initialForm = fields.reduce((acc, f) => {
    // Handle null/undefined values properly to avoid React warnings
    let value = row && row[f.name] !== undefined && row[f.name] !== null 
      ? row[f.name] 
      : (f.type === 'select' ? f.options[0].value : '');
    
    // Ensure value is never null for controlled inputs
    acc[f.name] = value === null ? '' : value;
    return acc;
  }, {});
  const [form, setForm] = React.useState(initialForm);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm(fields.reduce((acc, f) => { acc[f.name] = f.type === 'select' ? f.options[0].value : ''; return acc; }, {}));
      if (onSuccess) onSuccess();
    }
  });
  const updateMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setForm(fields.reduce((acc, f) => { acc[f.name] = f.type === 'select' ? f.options[0].value : ''; return acc; }, {}));
      if (onSuccess) onSuccess();
    }
  });

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ ...form, id: row.id });
    } else {
      createMutation.mutate(form);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">{editing ? `Rediger ${modelPrintName}` : `Ny ${modelPrintName}`}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.filter(f => !(editing ? f.hiddenEdit : f.hiddenCreate)).map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-neutral-700">{field.label}</label>
            {field.type === 'select' ? (
              <select
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required={field.required}
              >
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required={field.required}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-lg px-5 py-2.5 font-medium shadow-sm hover:bg-blue-600 transition-all"
          >
            {editing ? `Oppdater ${modelPrintName}` : `Opprett ${modelPrintName}`}
          </button>
          {onCancel && (
            <button
              type="button"
              className="bg-neutral-100 text-neutral-700 rounded-lg px-5 py-2.5 font-medium border border-neutral-300 hover:bg-neutral-200 transition-all"
              onClick={onCancel}
            >
              Avbryt
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
