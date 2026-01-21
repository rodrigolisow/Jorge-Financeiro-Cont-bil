import { getOrCreateDbUser } from "@/lib/auth";
import CrudPage from "@/app/app/finance/_components/CrudPage";

export default async function SuppliersPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <CrudPage
      title="Fornecedores"
      endpoint="/api/finance/suppliers"
      canEdit={canEdit}
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "document", label: "Documento", type: "text", optional: true },
      ]}
    />
  );
}
