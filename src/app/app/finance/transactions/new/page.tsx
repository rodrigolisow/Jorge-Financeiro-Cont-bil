import { getOrCreateDbUser } from "@/lib/auth";
import TransactionForm from "@/app/app/finance/transactions/_components/TransactionForm";

export default async function NewTransactionPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return (
    <main style={{ padding: 32 }}>
      <h1>Novo lançamento</h1>
      <TransactionForm mode="create" canEdit={canEdit} />
    </main>
  );
}
