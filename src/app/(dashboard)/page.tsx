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

  // Core Values Settings
  const { data: cvSetting } = await supabase
    .from("core_values_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  // Core Values items
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

  let empStats: any = null;
  if (role === "employee") {
    const now = new Date();
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const yr = now.getFullYear();
    const lastDay = String(new Date(yr, now.getMonth() + 1, 0).getDate());
    const firstDay = `${yr}-${mo}-01`;
    const lastDayFull = `${yr}-${mo}-${lastDay}`;

    const { data: att } = await supabase
      .from("attendance")
      .select("status, late_minutes")
      .eq("employee_id", emp.id)
      .gte("attendance_date", firstDay)
      .lte("attendance_date", lastDayFull);

    empStats = {
      hadir: (att ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length,
      tidakHadir: (att ?? []).filter((a: any) => a.status === "tidak_hadir").length,
      terlambat: (att ?? []).filter((a: any) => a.late_minutes > 0).length,
    };
  }

  let managerStats: any = null;
  if (role === "manager") {
    const today = new Date().toISOString().slice(0, 10);
    const deptEmpIds = (await supabase.from("employees").select("id").eq("department_id", emp.department_id)).data?.map((e: any) => e.id) ?? [];
    const { data: teamAtt } = await supabase.from("attendance").select("status").eq("attendance_date", today).in("employee_id", deptEmpIds);
    managerStats = {
      total: deptEmpIds.length,
      hadir: (teamAtt ?? []).filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length,
      tidakHadir: (teamAtt ?? []).filter((a: any) => a.status === "tidak_hadir").length,
    };
  }

  let adminStats: any = null;
  if (isAdminOrHr) {
    const today = new Date().toISOString().slice(0, 10);
    const { count: activeEmp } = await supabase.from("employees").select("*", { count: "exact" }).eq("status", "active");
    const { data: todayAtt } = await supabase.from("attendance").select("status").eq("attendance_date", today);
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
      {/* ===== CORE VALUES SECTION ===== */}
      {cvSetting && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide">
              {cvSetting.company_name} — Core Values
            </h2>
            {role === "admin" && (
              <Link href="/settings/core-values" className="text-xs text-teal-600 hover:underline">
                Manage
              </Link>
            )}
          </div>

          {/* Hero row: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left: hero title + description */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-teal-700 tracking-tight leading-tight">
                {cvSetting.hero_title}
              </h1>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-lg">
                {cvSetting.hero_description}
              </p>
            </div>
            {/* Right: banner image */}
            {cvSetting.banner_image_url && (
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={cvSetting.banner_image_url}
                  alt="Core Values Banner"
                  className="w-full h-56 md:h-64 object-cover"
                />
              </div>
            )}
          </div>

          {/* 6 cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(coreValues ?? []).map((cv: any, idx: number) => (
              <Card
                key={cv.id}
                className="group bg-gray-50 border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all rounded-xl"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{cv.icon || "✨"}</span>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide text-gray-800 group-hover:text-teal-700 transition-colors">
                        {cv.title}
                      </h3>
                      <div className="w-8 h-0.5 bg-rose-400 mt-1.5 mb-2 rounded-full" />
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {cv.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ===== RINGKASAN ===== */}
      <section>
        <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide mb-4">
          Ringkasan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {role === "employee" && empStats && (
            <>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir (Bulan Ini)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{empStats.hadir}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{empStats.tidakHadir}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Terlambat</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-yellow-600">{empStats.terlambat}</p></CardContent></Card>
              <Card className="opacity-50"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sisa Cuti</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Akan tersedia setelah modul Approval Harian aktif</p></CardContent></Card>
            </>
          )}
          {role === "manager" && managerStats && (
            <>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tim Hadir (Hari Ini)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{managerStats.hadir} <span className="text-sm font-normal text-muted-foreground">/ {managerStats.total}</span></p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{managerStats.tidakHadir}</p></CardContent></Card>
              <Card className="opacity-50"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Menunggu Approval</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground italic">Akan tersedia setelah modul Approval Harian aktif</p></CardContent></Card>
            </>
          )}
          {isAdminOrHr && adminStats && (
            <>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Karyawan Aktif</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{adminStats.totalActive}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{adminStats.hadirToday}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tidak Hadir Hari Ini</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-600">{adminStats.tidakHadirToday}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Tingkat Kehadiran</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{adminStats.attendanceRate}%</p></CardContent></Card>
            </>
          )}
        </div>
      </section>

      {/* ===== PENGUMUMAN ===== */}
      {(announcements ?? []).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide">Pengumuman</h2>
            {isAdminOrHr && <Link href="/announcements/manage" className="text-xs text-teal-600 hover:underline">Manage</Link>}
          </div>
          <div className="space-y-3">
            {(announcements ?? []).map((a: any) => (
              <Card key={a.id} className={a.is_pinned ? "border-teal-200 bg-teal-50/50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {a.is_pinned && <Badge variant="default" className="text-[10px] bg-teal-600">📌</Badge>}
                    <CardTitle className="text-sm">{a.title}</CardTitle>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {a.employees?.full_name} · {new Date(a.published_at).toLocaleDateString("id-ID")}
                  </p>
                </CardHeader>
                <CardContent><p className="text-xs whitespace-pre-wrap text-gray-600">{a.content}</p></CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
