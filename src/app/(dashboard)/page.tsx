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

  const { data: cvSetting } = await supabase
    .from("core_values_settings").select("*").limit(1).maybeSingle();

  const { data: coreValues } = await supabase
    .from("company_core_values").select("*").eq("is_active", true).order("display_order");

  const { data: announcements } = await supabase
    .from("announcements").select("*, employees!inner(full_name)").eq("is_active", true)
    .order("is_pinned", { ascending: false }).order("published_at", { ascending: false }).limit(5);

  return (
    <div className="space-y-8">
      {/* ===== CORE VALUES ===== */}
      {cvSetting && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide">
              {cvSetting.company_name} — Core Values
            </h2>
            {role === "admin" && (
              <Link href="/settings/core-values" className="text-xs text-teal-600 hover:underline">Manage</Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-teal-700 tracking-tight leading-tight">
                {cvSetting.hero_title}
              </h1>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-lg">{cvSetting.hero_description}</p>
            </div>
            {cvSetting.banner_image_url && (
              <div className="overflow-hidden rounded-2xl">
                <img src={cvSetting.banner_image_url} alt="Banner" className="w-full h-56 md:h-64 object-cover" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(coreValues ?? []).map((cv: any) => (
              <Card key={cv.id} className="group bg-gray-50 border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all rounded-xl">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{cv.icon || "✨"}</span>
                    <div>
                      <h3 className="font-bold text-sm uppercase tracking-wide text-gray-800 group-hover:text-teal-700 transition-colors">{cv.title}</h3>
                      <div className="w-8 h-0.5 bg-rose-400 mt-1.5 mb-2 rounded-full" />
                      <p className="text-xs text-gray-500 leading-relaxed">{cv.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

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
