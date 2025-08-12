import React from 'react';
import RowList from '@/components/tableComponents/RowList';
import { getPaginatedEnhet } from '@/api/endpoints';

export default function Enhetsadministrasjon() {
  const fields = [
    { name: 'navn', label: 'Navn' },
    { name: 'beskrivelse', label: 'Beskrivelse' },
    { name: 'level', label: 'Nivå' },
    { name: 'parentId', label: 'Overordnet Enhet' },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Enhetsadministrasjon</h1>
      <RowList
        fields={fields}
        queryKey={['enheter']}
        queryFn={getPaginatedEnhet} // Ensure this is the correct function
        onEdit={(row) => console.log('Edit:', row)}
        deleteFn={(id) => console.log('Delete:', id)}
      />
    </div>
  );
}
