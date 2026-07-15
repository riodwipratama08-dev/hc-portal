"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function recordOvertime(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const attendanceId = formData.get("attendance_id") as string;
  const employeeId = formData.get("employee_id") as string;
  const overtimeMinutes = parseInt(formData.get("overtime_minutes") as string, 10);
  const notes = (formData.get("notes") as string) || null;

  if (!attendanceId || !employeeId || isNaN(overtimeMinutes)) {
    return { error: "Invalid form data." };
  }

  if (overtimeMinutes < 30) {
    return { error: "Overtime must be at least 30 minutes." };
  }

  const { data: recorder } = await supabase
    .from("employees")
    .select("id, role, department_id")
    .eq("email", user.email)
    .single();

  if (!recorder) return { error: "Employee record not found." };

  if (recorder.role !== "manager") {
    return { error: "Only SPV/Manager can record overtime." };
  }

  const { data: targetEmployee } = await supabase
    .from("employees")
    .select("id, department_id")
    .eq("id", employeeId)
    .single();

  if (!targetEmployee) return { error: "Target employee not found." };

  if (targetEmployee.department_id !== recorder.department_id) {
    return { error: "You can only record overtime for employees in your own department." };
  }

  const { error } = await supabase.from("overtime_records").insert({
    attendance_id: attendanceId,
    employee_id: employeeId,
    recorded_by: recorder.id,
    overtime_minutes: overtimeMinutes,
    notes,
    status: "recorded",
  });

  if (error) return { error: error.message };

  revalidatePath("/attendance");
  return { success: true };
}
