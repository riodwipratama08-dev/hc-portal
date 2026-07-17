import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isWriteAllowed } from "@/lib/rbac";
import { isOvertimeCandidate } from "@/lib/attendance-logic";
import { OvertimeView } from "./overtime-view";

export const dynamic = "force-dynamic";

export default async function OvertimePage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const supabase = createClient();
  const emp = await getCurrentEmployee();
  const role = emp.role;
  const canWrite = isWriteAllowed(role);
  const isManager = role === "manager";
  const sp = await props.searchParams;
  const tab = sp?.tab === "history" ? "history" : "candidates";

  if (!canWrite && !isManager) {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized</div>;
  }

  // Get overtime settings per department
  const { data: otSettings } = await supabase.from("overtime_settings").select("*");
  const settingsMap: Record<string, number> = {};
  for (const s of (otSettings ?? [])) settingsMap[s.department_id] = s.minimum_overtime_minutes;

  // Get already confirmed records
  const { data: confirmedRecords } = await supabase.from("overtime_records").select("attendance_id").eq("status", "approved");
  const confirmedIds = new Set((confirmedRecords ?? []).map((r: any) => r.attendance_id));

  // Build attendance query
  let query = supabase
    .from("attendance")
    .select("*, employees(id, full_name, employee_code, department_id, departments(name))")
    .eq("status", "hadir")
    .not("actual_check_in", "is", null)
    .limit(500);

  if (isManager) {
    const deptEmpIds = (await supabase.from("employees").select("id").eq("department_id", emp.department_id)).data?.map((e: any) => e.id) ?? [];
    query = query.in("employee_id", deptEmpIds.filter((id: string) => id !== emp.id));
  }

  const { data: rows } = await query as { data: any[] | null };

  // Calculate candidates
  const candidates = (rows ?? []).map((r: any) => {
    const deptMin = settingsMap[r.employees?.department_id] ?? 30;
    const ot = isOvertimeCandidate({
      scheduled_check_in: r.scheduled_check_in,
      actual_check_in: r.actual_check_in,
      scheduled_check_out: r.scheduled_check_out,
      actual_check_out: r.actual_check_out,
      status: r.status,
      minimum_overtime_minutes: deptMin,
    });
    return { ...r, _ot: ot, _dept_min: deptMin, _confirmed: confirmedIds.has(r.id) };
  }).filter((r: any) => r._ot.isCandidate && !r._confirmed);

  // Get history
  const { data: history } = await supabase
    .from("overtime_records")
    .select("*, attendance!inner(id, attendance_date, shift_name, employees!inner(full_name, employee_code))")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Overtime</h1>
      <OvertimeView
        candidates={candidates}
        history={(history ?? []) as any[]}
        currentUserId={emp.id}
        activeTab={tab}
        deptMinMap={settingsMap}
      />
    </div>
  );
}
