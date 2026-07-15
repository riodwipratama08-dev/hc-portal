import { createClient } from "@/lib/supabase/server";
import { LeaveForm } from "./leave-form";

export const dynamic = "force-dynamic";

export default async function NewLeavePage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("leave_categories")
    .select("*, leave_reasons(id, label, is_active)")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ajukan Izin/Cuti</h1>
      <LeaveForm categories={(categories ?? []) as any[]} />
    </div>
  );
}
