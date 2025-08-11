import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RowForm from './RowForm';
import { useQuery } from '@tanstack/react-query';
import { getModelConfig } from '../../config/modelConfigs';

export default function RowEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const modelType = location.state?.modelType;
  const config = getModelConfig(modelType);
  

  const { data, isLoading, isError, error } = useQuery({ 
    queryKey: config?.queryKey, 
    queryFn: config?.queryFn, 
    select: res => res.data || [] 
  });
  const row = data?.find(r => String(r.id) === String(id));

  if (!config) {
    return <div className="p-8">Error: Model configuration not found for {modelType}</div>;
  }

  if (isLoading) {
    return <div className="p-8">.</div>;
  }

  if (isError) {
    return <div className="p-8">Feil ved lasting: {error?.message || 'Ukjent feil'}</div>;
  }

  if (!row) {
    return <div className="p-8">Fant ikke {config.modelPrintName} med id {id}.</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
        <h2 className="text-2xl font-bold mb-4">Rediger {config.modelPrintName}</h2>
        <RowForm 
          fields={config.fields} 
          row={row} 
          modelPrintName={config.modelPrintName}
          queryKey={config.queryKey}
          updateFn={config.updateFn}
          onSuccess={() => navigate(-1)} 
          onCancel={() => navigate(-1)} 
        />
      </div>
    </div>
  );
}
