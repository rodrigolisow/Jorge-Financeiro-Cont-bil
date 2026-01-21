import { getOrCreateDbUser } from "@/lib/auth";
import JournalForm from "@/app/app/accounting/journal/_components/JournalForm";

export default async function NewJournalPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "ACCOUNTING";

  return <JournalForm canEdit={canEdit} />;
}
