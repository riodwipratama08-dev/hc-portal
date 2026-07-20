import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReportsContent } from "./reports-content";

export const dynamic = "force-dynamic";

export default async function ReportsPage(props: {
  searchParams?: Promise<{ tab?: string; start?: string; end?: string; dept?: string }>;
}) {
  const supabase = createClient();
  const emp = await getCurrentEmployee();
  const role = emp.role;
  const sp = await props.searchParams;

  if (role === "employee") {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Hanya Admin, HR, Manager, dan Executive yang dapat mengakses laporan.</div>;
  }

  const { data: departments } = role !== "manager"
    ? await supabase.from("departments").select("id, name").order("name")
    : { data: [] };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <ReportsContent
        departments={(departments ?? []) as any[]}
        role={role}
        defaultTab={sp?.tab || "attendance"}
        defaultStart={sp?.start || ""}
        defaultEnd={sp?.end || ""}
        defaultDept={sp?.dept || ""}
      />
    </div>
  );
}
