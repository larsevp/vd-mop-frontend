import React from 'react';
import { useNavigate } from 'react-router-dom';
import RowList from '../components/RowList';
import AdminPage from '../components/AdminPage';
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

  return (
    <AdminPage
      title="Prosjektadministrasjon"
      description="Administrer prosjekter, opprett nye og rediger eksisterende prosjekter"
      listTitle="Prosjektliste"
      newButtonLabel="Nytt prosjekt"
      onNew={handleNew}
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
