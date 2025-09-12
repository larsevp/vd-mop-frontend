import React from "react";
import { useNavigate } from "react-router-dom";
import { RowList, AdminPage } from "@/components/tableComponents";
import { getModelConfig } from "@/modelConfigs";
import { user } from "@/modelConfigs/models/user";
import { useBackNavigation } from "@/hooks/useBackNavigation";

export default function Brukeradministrasjon() {
  const navigate = useNavigate();
  const { goBack } = useBackNavigation();
  const config = user; //getModelConfig("users");

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
    goBack();
  }

  return (
    <AdminPage
      title={config.title}
      description={config.desc}
      listTitle={config.title}
      newButtonLabel={config.newButtonLabelText}
      onNew={handleNew}
      onBack={handleBack}
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
