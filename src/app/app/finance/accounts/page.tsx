import { getOrCreateDbUser } from "@/lib/auth";
import CrudPage from "@/app/app/finance/_components/CrudPage";

const accountTypes = [
  { label: "Banco", value: "BANK" },
  { label: "Caixa", value: "CASH" },
  { label: "Outros", value: "OTHER" },
];

export default async function AccountsPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <CrudPage
      title="Contas financeiras"
      endpoint="/api/finance/accounts"
      canEdit={canEdit}
      fields={[
        { name: "name", label: "Nome", type: "text" },
        { name: "type", label: "Tipo", type: "select", options: accountTypes },
      ]}
    />
  );
}
