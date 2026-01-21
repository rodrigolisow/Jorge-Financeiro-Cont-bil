import { getOrCreateDbUser } from "@/lib/auth";
import MappingRules from "@/app/app/accounting/mapping/_components/MappingRules";

export default async function MappingPage() {
  const user = await getOrCreateDbUser();
  const canEdit = user.role === "ADMIN" || user.role === "ACCOUNTING";

  return <MappingRules canEdit={canEdit} />;
}
