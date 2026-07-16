"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isWriteAllowed } from "@/lib/rbac";

async function checkWriteAccess() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  return emp ? isWriteAllowed(emp.role) : false;
}

export async function createSchedule(formData: FormData) {
  if (!(await checkWriteAccess())) return { error: "Unauthorized" };
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
  if (!(await checkWriteAccess())) return { error: "Unauthorized" };
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
  if (!(await checkWriteAccess())) return { error: "Unauthorized" };
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
  if (!(await checkWriteAccess())) return { error: "Unauthorized" };
  const supabase = createClient();

  const { error } = await supabase.from("employee_schedules").insert({
    employee_id: employeeId,
    schedule_id: scheduleId,
    effective_start: effectiveStart,
  });

  if (error) return { error: error.message };

  revalidatePath(`/schedules/${scheduleId}/assign`);
}
