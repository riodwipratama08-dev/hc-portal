import { createClient } from "@/lib/supabase/server";
import { AttendanceList } from "./attendance-list";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, string> = {
  date: "attendance_date",
  shift_name: "shift_name",
  status: "status",
  check_in: "scheduled_check_in",
  actual_in: "actual_check_in",
  late: "late_minutes",
  check_out: "scheduled_check_out",
  actual_out: "actual_check_out",
  early: "early_leave_minutes",
  remarks: "remarks",
};

export default async function AttendancePage(props: {
  searchParams?: Promise<{
    start_date?: string;
    end_date?: string;
    department_id?: string;
    status?: string;
    sort_by?: string;
    sort_dir?: string;
  }>;
}) {
  const supabase = createClient();
  const sp = await props.searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employee } = await supabase
    .from("employees")
    .select("id, role, full_name, department_id, departments(name)")
    .eq("email", user?.email)
    .single();

  const role = employee?.role ?? "employee";
  const isAdminOrHr = role === "admin" || role === "hr";

  let query = supabase
    .from("attendance")
    .select("*, employees(id, full_name, employee_code, department_id, departments(name))")
    .limit(500);

  if (role === "employee") {
    query = query.eq("employee_id", employee!.id);
  } else if (role === "manager" && employee?.department_id) {
    query = query.in(
      "employee_id",
      (
        await supabase
          .from("employees")
          .select("id")
          .eq("department_id", employee.department_id)
      ).data?.map((e: any) => e.id) ?? []
    );
  }

  if (sp?.start_date) query = query.gte("attendance_date", sp.start_date);
  if (sp?.end_date) query = query.lte("attendance_date", sp.end_date);
  if (sp?.status) query = query.eq("status", sp.status);
  if (sp?.department_id && isAdminOrHr) {
    query = query.in(
      "employee_id",
      (
        await supabase
          .from("employees")
          .select("id")
          .eq("department_id", sp.department_id)
      ).data?.map((e: any) => e.id) ?? []
    );
  }

  const sortBy = sp?.sort_by && SORT_MAP[sp.sort_by] ? SORT_MAP[sp.sort_by] : "attendance_date";
  const ascending = sp?.sort_dir === "asc";
  query = query.order(sortBy, { ascending });

  const { data: attendance } = await query;

  const { data: departments } = isAdminOrHr
    ? await supabase.from("departments").select("*").order("name")
    : { data: [] };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        {isAdminOrHr && (
          <a
            href="/attendance/import"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Import CSV
          </a>
        )}
      </div>

      <AttendanceList
        attendance={(attendance ?? []) as any[]}
        role={role}
        departments={(departments ?? []) as any[]}
        currentStartDate={sp?.start_date ?? ""}
        currentEndDate={sp?.end_date ?? ""}
        currentDepartmentId={sp?.department_id ?? ""}
        currentStatus={sp?.status ?? ""}
        sortBy={sp?.sort_by ?? ""}
        sortDir={sp?.sort_dir ?? ""}
      />
    </div>
  );
}
