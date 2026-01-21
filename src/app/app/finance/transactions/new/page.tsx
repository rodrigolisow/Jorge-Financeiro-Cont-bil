import { getOrCreateDbUser } from "@/lib/auth";
import TransactionForm from "@/app/app/finance/transactions/_components/TransactionForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function NewTransactionPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Novo Lançamento Financeiro"
        description="Registre uma nova receita ou despesa."
      />
      <TransactionForm mode="create" canEdit={canEdit} />
    </div>
  );
}
