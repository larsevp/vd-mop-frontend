import React from "react";
import { useNavigate } from "react-router-dom";
import { RowList, AdminPage } from "@/components/tableComponents";
import { getModelConfig } from "../../modelConfigs";

export default function Brukeradministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig("users");

  function handleEdit(user) {
    navigate(`/admin/${user.id}/rediger`, {
      state: { modelType: "users" },
    });
  }
  function handleNew() {
    navigate("/admin/ny", {
      state: { modelType: "users" },
    });
  }

  function handleBack() {
    navigate(-1);
  }

  return (
    <AdminPage
      title="Brukeradministrasjon"
      description="Administrer brukere, opprett nye og rediger eksisterende brukere"
      listTitle="Brukerliste"
      newButtonLabel="Ny bruker"
      onNew={handleNew}
      onBack={handleBack}
      showBackButton={true}
      backButtonLabel="Tilbake"
      showNewButton={false} // Kan settes til false for å skjule knappen
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
