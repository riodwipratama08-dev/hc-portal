import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditLogViewer } from "./audit-viewer";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee().catch(() => null);
  if (!emp || emp.role !== "admin") {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin can access.</div>;
  }

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, employees!inner(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: employees } = await supabase.from("employees").select("id, full_name").eq("status", "active").order("full_name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Audit Logs</h1>
      <AuditLogViewer logs={(logs ?? []) as any[]} employees={(employees ?? []) as any[]} />
    </div>
  );
}
