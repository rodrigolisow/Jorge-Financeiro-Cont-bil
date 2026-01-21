import { getOrCreateDbUser } from "@/lib/auth";
import JournalList from "@/app/app/accounting/journal/_components/JournalList";

export default async function JournalPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "ACCOUNTING";

  return <JournalList canEdit={canEdit} />;
}
