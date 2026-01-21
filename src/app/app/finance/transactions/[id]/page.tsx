import { getOrCreateDbUser } from "@/lib/auth";
import TransactionForm from "@/app/app/finance/transactions/_components/TransactionForm";
import { PageHeader } from "@/components/ui/PageHeader";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTransactionPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Editar Lançamento"
        description={`ID: ${id}`}
      />
      <TransactionForm
        mode="edit"
        transactionId={id}
        canEdit={canEdit}
      />
    </div>
  );
}
