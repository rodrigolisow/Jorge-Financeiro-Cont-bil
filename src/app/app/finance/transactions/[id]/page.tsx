import { getOrCreateDbUser } from "@/lib/auth";
import TransactionForm from "@/app/app/finance/transactions/_components/TransactionForm";

type PageProps = {
  params: { id: string };
};

export default async function EditTransactionPage({ params }: PageProps) {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <main style={{ padding: 32 }}>
      <h1>Editar lançamento</h1>
      <TransactionForm
        mode="edit"
        transactionId={params.id}
        canEdit={canEdit}
      />
    </main>
  );
}
