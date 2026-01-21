import { getOrCreateDbUser } from "@/lib/auth";
import ChartManager from "@/app/app/accounting/chart/_components/ChartManager";

export default async function ChartPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "ACCOUNTING";

  return <ChartManager canEdit={canEdit} />;
}
