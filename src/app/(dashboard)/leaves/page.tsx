import { createClient } from "@/lib/supabase/server";
import { LeaveList } from "./leave-list";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LeavesPage(props: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const supabase = createClient();
  const sp = await props.searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: emp } = await supabase
    .from("employees")
    .select("id, role, department_id")
    .eq("email", user?.email)
    .single();

  const role = emp?.role ?? "employee";
  const isAdminOrHr = role === "admin" || role === "hr";

  if (!emp) {
    return <div className="p-8 text-lg text-red-600">Akun Anda belum terdaftar sebagai karyawan. Hubungi HR/Admin.</div>;
  }

  let query = supabase
    .from("leave_requests")
    .select("*, employees!inner(full_name, employee_code, department_id), leave_reasons(label), approvals(id, level, status, approver_id, employees!inner(full_name))")
    .order("created_at", { ascending: false });

  if (role === "employee") {
    query = query.eq("employee_id", emp!.id);
  } else if (role === "manager" && emp?.department_id) {
    // Manager sees requests from their department + their own
    const deptEmployeeIds = (
      await supabase.from("employees").select("id").eq("department_id", emp.department_id)
    ).data?.map((e: any) => e.id) ?? [];
    query = query.in("employee_id", [...deptEmployeeIds, emp!.id]);
  }

  if (sp?.status) query = query.eq("status", sp.status);

  const { data: requests } = await query;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <Button asChild>
          <a href="/leaves/new">+ New Request</a>
        </Button>
      </div>
      <LeaveList requests={(requests ?? []) as any[]} currentUserId={emp?.id ?? ""} currentStatus={sp?.status ?? ""} />
    </div>
  );
}
