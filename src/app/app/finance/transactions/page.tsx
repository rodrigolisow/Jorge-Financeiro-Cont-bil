import { getOrCreateDbUser } from "@/lib/auth";
import TransactionsList from "@/app/app/finance/transactions/_components/TransactionsList";

export default async function TransactionsPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "FINANCE";

  return <TransactionsList canEdit={canEdit} />;
}
