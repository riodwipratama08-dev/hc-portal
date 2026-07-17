import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function OvertimeSettingsPage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee().catch(() => null);
  if (!emp || (emp.role !== "admin" && emp.role !== "hr")) {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin & HR can access.</div>;
  }

  const { data: departments } = await supabase.from("departments").select("*").order("name");
  const { data: settings } = await supabase.from("overtime_settings").select("*");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Overtime Settings</h1>
      <SettingsForm departments={(departments ?? []) as any[]} settings={(settings ?? []) as any[]} />
    </div>
  );
}
