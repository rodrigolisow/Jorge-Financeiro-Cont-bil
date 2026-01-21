import { getOrCreateDbUser } from "@/lib/auth";
import CrudPage from "@/app/app/finance/_components/CrudPage";

export default async function PropertiesPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <CrudPage
      title="Imóveis"
      endpoint="/api/finance/properties"
      canEdit={canEdit}
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "code", label: "Código", type: "text", optional: true },
      ]}
    />
  );
}
