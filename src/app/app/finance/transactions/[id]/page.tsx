import { getOrCreateDbUser } from "@/lib/auth";
import TransactionForm from "@/app/app/finance/transactions/_components/TransactionForm";
import { PageHeader } from "@/components/ui/PageHeader";

type PageProps = {
  params: { id: string };
};

export default async function EditTransactionPage({ params }: PageProps) {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Editar Lançamento"
        description={`ID: ${params.id}`}
      />
      <TransactionForm
        mode="edit"
        transactionId={params.id}
        canEdit={canEdit}
      />
    </div>
  );
}
