"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function confirmOvertime(attendanceId: string, employeeId: string, overtimeMinutes: number, notes: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: recorder } = await supabase.from("employees").select("id, role, department_id").eq("email", user.email).single();
  if (!recorder) return { error: "Employee not found" };
  if (recorder.role !== "admin" && recorder.role !== "hr" && recorder.role !== "manager") {
    return { error: "Only Admin, HR, or Manager can confirm overtime." };
  }

  const { data: target } = await supabase.from("employees").select("id, department_id").eq("id", employeeId).single();
  if (!target) return { error: "Target employee not found" };
  if (recorder.role === "manager" && target.department_id !== recorder.department_id) {
    return { error: "You can only confirm overtime for your own department." };
  }

  const { data: otSetting } = await supabase.from("overtime_settings").select("minimum_overtime_minutes").eq("department_id", target.department_id).maybeSingle();
  const minMinutes = otSetting?.minimum_overtime_minutes ?? 30;
  if (overtimeMinutes < minMinutes) {
    return { error: `Overtime must be at least ${minMinutes} minutes for this department.` };
  }

  const { error } = await supabase.from("overtime_records").insert({
    attendance_id: attendanceId, employee_id: employeeId, recorded_by: recorder.id,
    overtime_minutes: overtimeMinutes, notes: notes || null, status: "approved",
  });
  if (error) return { error: error.message };
  revalidatePath("/overtime");
  return { success: true };
}
