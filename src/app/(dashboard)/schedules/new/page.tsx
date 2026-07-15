import { createClient } from "@/lib/supabase/server";
import { ScheduleForm } from "../schedule-form";
import { Shift } from "@/lib/types";

export default async function NewSchedulePage() {
  const supabase = createClient();

  const { data: shifts } = await supabase
    .from("shifts")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add New Schedule</h1>
      <ScheduleForm
        shifts={(shifts ?? []) as Shift[]}
        assignedShiftIds={[]}
      />
    </div>
  );
}
