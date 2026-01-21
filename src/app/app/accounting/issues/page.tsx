import { getOrCreateDbUser } from "@/lib/auth";
import IssuesList from "@/app/app/accounting/issues/_components/IssuesList";

export default async function IssuesPage() {
  const user = await getOrCreateDbUser();
  const canResolve = user.role === "ADMIN" || user.role === "ACCOUNTING";

  return <IssuesList canResolve={canResolve} />;
}
