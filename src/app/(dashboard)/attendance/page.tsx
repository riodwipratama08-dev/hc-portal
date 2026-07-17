import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceList } from "./attendance-list";
import { isWriteAllowed, canViewAllData } from "@/lib/rbac";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, string> = {
  date: "attendance_date", name: "employees(full_name)", shift_name: "shift_name", status: "status",
  check_in: "scheduled_check_in", actual_in: "actual_check_in", late: "late_minutes",
  check_out: "scheduled_check_out", actual_out: "actual_check_out", early: "early_leave_minutes",
  remarks: "remarks",
};

export default async function AttendancePage(props: {
  searchParams?: Promise<{
    start_date?: string; end_date?: string; department_id?: string;
    status?: string; sort_by?: string; sort_dir?: string; tab?: string; name?: string;
    page?: string; pageSize?: string;
  }>;
}) {
  const supabase = createClient();
  const sp = await props.searchParams;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: employee } = await supabase
    .from("employees").select("id, role, full_name, department_id, departments(name)")
    .eq("email", user?.email).single();

  const role = employee?.role ?? "employee";
  const canWrite = isWriteAllowed(role);
  const canViewAll = canViewAllData(role);
  const isManager = role === "manager";

  if (!employee) {
    return <div className="p-8 text-lg text-red-600">Akun Anda belum terdaftar sebagai karyawan. Hubungi HR/Admin.</div>;
  }

  // Tab logic for manager: me = self, team = department excluding self
  const tab = (isManager ? (sp?.tab || "me") : null) as "me" | "team" | null;
  const showOtButton = isManager && tab === "team";

  // ===== RINGKASAN PER ROLE =====
  let summaryTitle = "Ringkasan";
  let summaryCards: React.ReactNode = null;

  if (role === "employee") {
    summaryTitle = "Ringkasan Saya";
    const now = new Date(); const mo = String(now.getMonth() + 1).padStart(2, "0");
    const yr = now.getFullYear(); const lastDay = String(new Date(yr, now.getMonth() + 1, 0).getDate());
    const { data: att } = await supabase.from("attendance").select("status, late_minutes")
      .eq("employee_id", employee.id)
      .gte("attendance_date", `${yr}-${mo}-01`).lte("attendance_date", `${yr}-${mo}-${lastDay}`);
    const hadir = (att ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length;
    const tidakHadir = (att ?? []).filter((a: any) => a.status === "tidak_hadir").length;
    const terlambat = (att ?? []).filter((a: any) => a.late_minutes > 0).length;
    summaryCards = <><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir (Bulan Ini)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{hadir}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{tidakHadir}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Terlambat</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-yellow-600">{terlambat}</p></CardContent></Card><Card className="opacity-50"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sisa Cuti</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Akan tersedia setelah modul Approval Harian aktif</p></CardContent></Card></>;
  } else if (isManager) {
    summaryTitle = tab === "me" ? "Ringkasan Saya" : "Ringkasan Tim Saya";
    const deptIds = (await supabase.from("employees").select("id").eq("department_id", employee.department_id)).data?.map((e: any) => e.id) ?? [];
    const filteredIds = tab === "me" ? [employee.id] : deptIds.filter((id: string) => id !== employee.id);
    const today = new Date().toISOString().slice(0, 10);
    const { data: att } = await supabase.from("attendance").select("status").eq("attendance_date", today).in("employee_id", filteredIds);
    if (tab === "me") {
      const me = (att ?? []).find(() => true); if (me) { /* just calculate */ }
      summaryCards = <><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{(att ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{(att ?? []).filter((a: any) => a.status === "tidak_hadir").length}</p></CardContent></Card></>;
    } else {
      const total = filteredIds.length; const hadir = (att ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length;
      summaryCards = <><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Anggota Tim</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{total}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{hadir}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{(att ?? []).filter((a: any) => a.status === "tidak_hadir").length}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tingkat Kehadiran Tim</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{total > 0 ? Math.round((hadir / total) * 100) : 0}%</p></CardContent></Card></>;
    }
  } else if (canViewAll) {
    summaryTitle = "Ringkasan Perusahaan";
    const today = new Date().toISOString().slice(0, 10);
    const { count: activeEmp } = await supabase.from("employees").select("*", { count: "exact" }).eq("status", "active");
    const { data: todayAtt } = await supabase.from("attendance").select("status").eq("attendance_date", today);
    const hadir = (todayAtt ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length;
    const tidakHadir = (todayAtt ?? []).filter((a: any) => a.status === "tidak_hadir").length;
    const rate = (activeEmp ?? 0) > 0 ? Math.round((hadir / (activeEmp ?? 1)) * 100) : 0;
    summaryCards = <><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Karyawan Aktif</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{activeEmp ?? 0}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{hadir}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{tidakHadir}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tingkat Kehadiran</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{rate}%</p></CardContent></Card></>;
  }

  // ===== ATTENDANCE TABLE with pagination =====
  const page = Math.max(1, parseInt(sp?.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(sp?.pageSize ?? "50", 10) || 50));

  // Get total count for pagination display
  let countQuery = supabase.from("attendance").select("id", { count: "exact", head: true });
  // Apply same filters to count query (simplified — just use the main query's count)

  let query = supabase
    .from("attendance")
    .select("*, employees(id, full_name, employee_code, department_id, departments(name))", { count: "exact" });

  if (role === "employee") {
    query = query.eq("employee_id", employee.id);
  } else if (isManager) {
    const deptIds = (await supabase.from("employees").select("id").eq("department_id", employee.department_id)).data?.map((e: any) => e.id) ?? [];
    const filteredIds = tab === "me" ? [employee.id] : deptIds.filter((id: string) => id !== employee.id);
    if (filteredIds.length > 0) query = query.in("employee_id", filteredIds);
    else query = query.eq("employee_id", ""); // return empty
  }

  if (sp?.start_date) query = query.gte("attendance_date", sp.start_date);
  if (sp?.end_date) query = query.lte("attendance_date", sp.end_date);
  if (sp?.status) query = query.eq("status", sp.status);
  if (sp?.department_id && canViewAll) {
    query = query.in("employee_id", (await supabase.from("employees").select("id").eq("department_id", sp.department_id)).data?.map((e: any) => e.id) ?? []);
  }
  if (sp?.name) {
    const likeName = `%${sp.name}%`;
    query = query.ilike("employees.full_name", likeName);
  }

  const sortBy = sp?.sort_by && SORT_MAP[sp.sort_by] ? SORT_MAP[sp.sort_by] : "";
  const ascending = sp?.sort_dir === "asc";

  if (sortBy) { query = query.order(sortBy, { ascending }); }
  else { query = query.order("employees(full_name)", { ascending: true }).order("attendance_date", { ascending: false }); }

  // Apply pagination range
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: attendance, count: totalCount } = await query;

  const { data: departments } = canViewAll
    ? await supabase.from("departments").select("*").order("name")
    : { data: [] };

  // Date range info & available dates
  let dateRangeText = ""; let availableDates: string[] = [];
  const { data: importRanges } = await supabase.from("attendance_imports").select("period_start, period_end").order("period_start", { ascending: true });
  if (importRanges && importRanges.length > 0) {
    const ranges = importRanges.map((r: any) => {
      const s = new Date(r.period_start).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const e = new Date(r.period_end).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      return `${s} – ${e}`;
    });
    dateRangeText = ranges.length === 1 ? `Data tersedia dari ${ranges[0]}` : `Data tersedia dalam ${ranges.length} rentang: ${ranges.join(", ")}`;
  }
  const { data: dateRows } = await supabase.from("attendance").select("attendance_date").limit(500);
  if (dateRows) availableDates = Array.from(new Set(dateRows.map((d: any) => d.attendance_date))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        {canWrite && <a href="/attendance/import" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Import CSV</a>}
      </div>

      {/* ===== TAB NAVIGATION FOR MANAGER ===== */}
      {isManager && (
        <div className="flex gap-4 border-b pb-2">
          <Link href="/attendance?tab=me" className={`text-sm font-medium pb-1 border-b-2 transition-colors ${tab === "me" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            My Attendance
          </Link>
          <Link href="/attendance?tab=team" className={`text-sm font-medium pb-1 border-b-2 transition-colors ${tab === "team" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            Team Attendance
          </Link>
        </div>
      )}

      {/* ===== RINGKASAN ===== */}
      {summaryCards && (
        <section>
          <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide mb-4">{summaryTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">{summaryCards}</div>
        </section>
      )}

      <AttendanceList
        attendance={(attendance ?? []) as any[]}
        role={role}
        departments={(departments ?? []) as any[]}
        canViewAll={canViewAll}
        dateRangeText={dateRangeText}
        currentName={sp?.name ?? ""}
        currentPage={page}
        pageSize={pageSize}
        totalCount={totalCount ?? 0}
        availableDates={availableDates}
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
