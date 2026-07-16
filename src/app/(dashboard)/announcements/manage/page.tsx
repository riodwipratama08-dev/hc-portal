import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function AnnouncementManagePage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee().catch(() => null);
  if (!emp || (emp.role !== "admin" && emp.role !== "hr")) {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin & HR can access.</div>;
  }

  const { data: items } = await supabase
    .from("announcements")
    .select("*, employees!inner(full_name)")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Manage Announcements</h1>
      <AnnouncementManager items={(items ?? []) as any[]} />
    </div>
  );
}
