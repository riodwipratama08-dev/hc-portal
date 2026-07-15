import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ScheduleForm } from "../../schedule-form";
import { Shift } from "@/lib/types";

export default async function EditSchedulePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createClient();

  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  if (!schedule) notFound();

  const { data: shifts } = await supabase
    .from("shifts")
    .select("*")
    .eq("is_active", true)
    .order("name");

  const { data: scheduleShifts } = await supabase
    .from("schedule_shifts")
    .select("shift_id")
    .eq("schedule_id", id);

  const assignedShiftIds = (scheduleShifts ?? []).map((s: any) => s.shift_id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Schedule</h1>
      <p className="mb-4 text-sm text-gray-500">Editing: {schedule.name}</p>
      <ScheduleForm
        defaultValues={{
          id: schedule.id,
          name: schedule.name,
          description: schedule.description ?? "",
          is_active: schedule.is_active,
        }}
        shifts={(shifts ?? []) as Shift[]}
        assignedShiftIds={assignedShiftIds}
      />
    </div>
  );
}
