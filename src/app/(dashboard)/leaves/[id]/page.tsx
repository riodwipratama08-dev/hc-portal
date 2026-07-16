import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LeaveDetail } from "./leave-detail";
import { isWriteAllowed } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function LeaveDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createClient();

  const { data: lr } = await supabase
    .from("leave_requests")
    .select("*, employees!inner(full_name, employee_code, department_id), leave_reasons(label, leave_categories(name, affects_payroll_or_attendance))")
    .eq("id", id)
    .single();

  if (!lr) notFound();

  const { data: approvals } = await supabase
    .from("approvals")
    .select("*, employees!inner(full_name)")
    .eq("leave_request_id", id)
    .order("level");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentEmp } = await supabase
    .from("employees")
    .select("id, role")
    .eq("email", user?.email)
    .single();

  const execRole = currentEmp?.role;
  const isApprover = execRole !== "executive" && (approvals ?? []).some(
    (a: any) => a.approver_id === currentEmp?.id && a.status === "pending"
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Leave Request Detail</h1>
      <LeaveDetail
        request={lr as any}
        approvals={(approvals ?? []) as any[]}
        isApprover={isApprover}
        currentUserId={currentEmp?.id ?? ""}
      />
    </div>
  );
}
