import { requireUser } from "@/lib/auth/current";
import { MastersHub } from "@/components/masters/masters-hub";

export const dynamic = "force-dynamic";

export default async function MastersPage() {
  await requireUser();
  return <MastersHub />;
}
