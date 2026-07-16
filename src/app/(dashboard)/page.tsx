import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee();
  const role = emp.role;
  const isAdminOrHr = role === "admin" || role === "hr";

  // Core Values
  const { data: coreValues } = await supabase
    .from("company_core_values")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  // Announcements
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, employees!inner(full_name)")
    .eq("is_active", true)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(5);

  // --- Per-role summaries ---

  // Employee: attendance bulan ini
  let empStats: any = null;
  if (role === "employee") {
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

    const { data: att } = await supabase
      .from("attendance")
      .select("status, late_minutes")
      .eq("employee_id", emp.id)
      .gte("attendance_date", firstDay)
      .lte("attendance_date", lastDay);

    empStats = {
      hadir: (att ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length,
      tidakHadir: (att ?? []).filter((a: any) => a.status === "tidak_hadir").length,
      terlambat: (att ?? []).filter((a: any) => a.late_minutes > 0).length,
    };
  }

  // Manager: attendance tim hari ini
  let managerStats: any = null;
  if (role === "manager") {
    const today = new Date().toISOString().slice(0, 10);
    const deptEmpIds = (await supabase.from("employees").select("id").eq("department_id", emp.department_id)).data?.map((e: any) => e.id) ?? [];

    const { data: teamAtt } = await supabase
      .from("attendance")
      .select("status")
      .eq("attendance_date", today)
      .in("employee_id", deptEmpIds);

    managerStats = {
      total: deptEmpIds.length,
      hadir: (teamAtt ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length,
      tidakHadir: (teamAtt ?? []).filter((a: any) => a.status === "tidak_hadir").length,
    };
  }

  // Admin/HR: company-wide
  let adminStats: any = null;
  if (isAdminOrHr) {
    const today = new Date().toISOString().slice(0, 10);

    const { count: activeEmp } = await supabase.from("employees").select("*", { count: "exact" }).eq("status", "active");
    const { data: todayAtt } = await supabase.from("attendance").select("status").eq("attendance_date", today);
    const { data: deptBreakdown } = await supabase.from("employees").select("department_id").eq("status", "active");

    const deptCounts: Record<string, number> = {};
    for (const e of (deptBreakdown ?? [])) {
      deptCounts[e.department_id] = (deptCounts[e.department_id] ?? 0) + 1;
    }

    const hadir = (todayAtt ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length;
    const tidakHadir = (todayAtt ?? []).filter((a: any) => a.status === "tidak_hadir").length;

    adminStats = {
      totalActive: activeEmp ?? 0,
      hadirToday: hadir,
      tidakHadirToday: tidakHadir,
      attendanceRate: (activeEmp ?? 0) > 0 ? Math.round((hadir / (activeEmp ?? 1)) * 100) : 0,
    };
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Core Values */}
      {(coreValues ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Core Values</h2>
            {role === "admin" && <Link href="/settings/core-values" className="text-xs text-primary hover:underline">Manage</Link>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(coreValues ?? []).map((cv: any) => (
              <Card key={cv.id} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-2">{cv.icon || "🌟"}</div>
                  <h3 className="font-semibold text-sm">{cv.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cv.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Role-specific Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Ringkasan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Employee */}
          {role === "employee" && empStats && (
            <>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir (Bulan Ini)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{empStats.hadir}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{empStats.tidakHadir}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Terlambat</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-yellow-600">{empStats.terlambat}</p></CardContent></Card>
              <Card className="opacity-60"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sisa Cuti</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Akan tersedia setelah modul Approval Harian aktif</p></CardContent></Card>
            </>
          )}

          {/* Manager */}
          {role === "manager" && managerStats && (
            <>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tim Hadir (Hari Ini)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{managerStats.hadir} <span className="text-sm font-normal text-muted-foreground">/ {managerStats.total}</span></p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{managerStats.tidakHadir}</p></CardContent></Card>
              <Card className="opacity-60"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Menunggu Approval</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Akan tersedia setelah modul Approval Harian aktif</p></CardContent></Card>
            </>
          )}

          {/* Admin/HR */}
          {isAdminOrHr && adminStats && (
            <>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Karyawan Aktif</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{adminStats.totalActive}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{adminStats.hadirToday}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{adminStats.tidakHadirToday}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tingkat Kehadiran</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{adminStats.attendanceRate}%</p></CardContent></Card>
            </>
          )}
        </div>
      </div>

      {/* Announcements */}
      {(announcements ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pengumuman</h2>
            {isAdminOrHr && <Link href="/announcements/manage" className="text-xs text-primary hover:underline">Manage</Link>}
          </div>
          <div className="space-y-3">
            {(announcements ?? []).map((a: any) => (
              <Card key={a.id} className={a.is_pinned ? "border-primary/30 bg-primary/5" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {a.is_pinned && <Badge variant="default" className="text-[10px]">📌</Badge>}
                    <CardTitle className="text-sm">{a.title}</CardTitle>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {a.employees?.full_name} · {new Date(a.published_at).toLocaleDateString("id-ID")}
                  </p>
                </CardHeader>
                <CardContent><p className="text-xs whitespace-pre-wrap">{a.content}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
