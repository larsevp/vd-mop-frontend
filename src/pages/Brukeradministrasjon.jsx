import React from 'react';
import { useNavigate } from 'react-router-dom';
import RowList from '../components/RowList';
import AdminPage from '../components/AdminPage';
import { getModelConfig } from '../config/modelConfigs';

export default function Brukeradministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig('users');

  function handleEdit(user) {
    navigate(`/admin/${user.id}/rediger`, { 
      state: { modelType: 'users' } 
    });
  }
  function handleNew() {
    navigate('/admin/ny', { 
      state: { modelType: 'users' } 
    });
  }

  return (
    <AdminPage
      title="Brukeradministrasjon"
      description="Administrer brukere, opprett nye og rediger eksisterende brukere"
      listTitle="Brukerliste"
      newButtonLabel="Ny bruker"
      onNew={handleNew}
    >
      <RowList
        fields={config.fields}
        onEdit={handleEdit}
        queryKey={config.queryKey}
        queryFn={config.queryFn}
        deleteFn={config.deleteFn}
        loadingText="Laster brukere..."
      />
    </AdminPage>
  );
}
