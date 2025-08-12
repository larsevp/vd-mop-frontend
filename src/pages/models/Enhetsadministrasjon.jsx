import React from 'react';
import RowList from '@/components/tableComponents/RowList';
import { getModelConfig } from '../../config/modelConfigs';
import { useNavigate } from 'react-router-dom';

export default function Enhetsadministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig('enheter');  
  
  function handleEdit(row) {
    navigate(`/enheter/${row.id}/rediger`, { 
      state: { modelType: 'enheter' } 
    });
  }
  function handleNew() {
    navigate('/enheter/ny', { 
      state: { modelType: 'enheter' } 
    });
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Enhetsadministrasjon</h1>
      <RowList
        fields={config.fields}
        queryKey={['enheter']}
        queryKey={config.queryKey}
        queryFn={config.queryFn}
        deleteFn={config.deleteFn}
      />
    </div>
  );
}
