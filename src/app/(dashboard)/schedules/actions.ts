"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSchedule(formData: FormData) {
  const supabase = createClient();

  const scheduleData = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase.from("schedules").insert(scheduleData);

  if (error) return { error: error.message };

  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function updateSchedule(id: string, formData: FormData) {
  const supabase = createClient();

  const scheduleData = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase.from("schedules").update(scheduleData).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function assignShiftToSchedule(
  scheduleId: string,
  shiftId: string,
  action: "add" | "remove"
) {
  const supabase = createClient();

  if (action === "add") {
    const { error } = await supabase
      .from("schedule_shifts")
      .insert({ schedule_id: scheduleId, shift_id: shiftId });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("schedule_shifts")
      .delete()
      .eq("schedule_id", scheduleId)
      .eq("shift_id", shiftId);
    if (error) return { error: error.message };
  }

  revalidatePath(`/schedules/${scheduleId}/edit`);
}

export async function assignScheduleToEmployee(
  employeeId: string,
  scheduleId: string,
  effectiveStart: string
) {
  const supabase = createClient();

  const { error } = await supabase.from("employee_schedules").insert({
    employee_id: employeeId,
    schedule_id: scheduleId,
    effective_start: effectiveStart,
  });

  if (error) return { error: error.message };

  revalidatePath(`/schedules/${scheduleId}/assign`);
}
