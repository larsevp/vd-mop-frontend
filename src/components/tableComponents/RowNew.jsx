import React from 'react';
import { useLocation } from 'react-router-dom';
import RowForm from './RowForm';
import { getModelConfig } from '../../config/modelConfigs';

export default function RowNew() {
  const location = useLocation();
  const modelType = location.state?.modelType;
  const config = getModelConfig(modelType);
  
  if (!config) {
    return <div className="p-8">Error: Model configuration not found for {modelType}</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
        <h2 className="text-2xl font-bold mb-4">Nytt {config.modelPrintName}</h2>
        <RowForm
          fields={config.fields}
          modelPrintName={config.modelPrintName}
          createFn={config.createFn}
          queryKey={config.queryKey}
          onSuccess={() => window.history.back()}
          onCancel={() => window.history.back()}
        />
      </div>
    </div>
  );
}
