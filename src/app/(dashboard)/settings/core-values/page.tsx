import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CoreValueManager } from "./manager";
import { HeroSettingsForm } from "./hero-settings";

export const dynamic = "force-dynamic";

export default async function CoreValuesPage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee().catch(() => null);
  if (!emp || emp.role !== "admin") {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin can access.</div>;
  }

  const { data: values } = await supabase.from("company_core_values").select("*").order("display_order");
  const { data: settings } = await supabase.from("core_values_settings").select("*").limit(1).maybeSingle();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Manage Core Values</h1>

      <HeroSettingsForm defaults={settings} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Value Items</h2>
        <CoreValueManager values={(values ?? []) as any[]} />
      </div>
    </div>
  );
}
