import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RowList, AdminPage } from '../components/tableComponents';
import { getModelConfig } from '../config/modelConfigs';

export default function Prosjektadministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig('prosjekter');

  function handleEdit(row) {
    navigate(`/prosjekter/${row.id}/rediger`, { 
      state: { modelType: 'prosjekter' } 
    });
  }
  function handleNew() {
    navigate('/prosjekter/ny', { 
      state: { modelType: 'prosjekter' } 
    });
  }

  function handleBack() {
    navigate('/');
  }

  return (
    <AdminPage
      title="Prosjektadministrasjon"
      description="Administrer prosjekter, opprett nye og rediger eksisterende prosjekter"
      listTitle="Prosjektliste"
      newButtonLabel="Nytt prosjekt"
      onNew={handleNew}
      onBack={handleBack}
      showBackButton={true}
      backButtonLabel="Tilbake til hovedsiden"
    >
      <RowList
        fields={config.fields}
        onEdit={handleEdit}
        queryKey={config.queryKey}
        queryFn={config.queryFn}
        deleteFn={config.deleteFn}
        loadingText="Laster prosjekter..."
      />
    </AdminPage>
  );
}
