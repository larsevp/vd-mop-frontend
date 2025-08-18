import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "../../modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Vurderingadministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig("vurderinger");

  function handleEdit(row) {
    navigate(`/vurderinger/${row.id}/rediger`, {
      state: { modelType: "vurderinger" },
    });
  }
  function handleNew() {
    navigate("/vurderinger/ny", {
      state: { modelType: "vurderinger" },
    });
  }
  function handleBack() {
    navigate(-1);
  }
  return (
    <AdminPage
      title="Vurdering administrasjon"
      description="Administrer vurderinger"
      listTitle="Vurderinger"
      newButtonLabel="Ny vurdering"
      onNew={handleNew}
      onBack={handleBack}
      showBackButton={true}
      backButtonLabel="Tilbake"
    >
      <RowList fields={config.fields} queryKey={config.queryKey} onEdit={handleEdit} queryFn={config.queryFn} deleteFn={config.deleteFn} />
    </AdminPage>
  );
}
