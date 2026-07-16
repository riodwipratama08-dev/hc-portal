import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CoreValueManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function CoreValuesPage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee().catch(() => null);
  if (!emp || emp.role !== "admin") {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin can access.</div>;
  }

  const { data: values } = await supabase.from("company_core_values").select("*").order("display_order");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Manage Core Values</h1>
      <CoreValueManager values={(values ?? []) as any[]} />
    </div>
  );
}
