"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isWriteAllowed } from "@/lib/rbac";

export async function updateOvertimeSetting(departmentId: string, minimumMinutes: number, overtimeType: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  if (!emp || !isWriteAllowed(emp.role)) return { error: "Unauthorized" };

  const { data: existing } = await supabase.from("overtime_settings").select("id").eq("department_id", departmentId).maybeSingle();

  const data = {
    minimum_overtime_minutes: overtimeType === "tunjangan_bulanan" ? 0 : minimumMinutes,
    overtime_type: overtimeType,
  };

  if (existing) {
    await supabase.from("overtime_settings").update(data).eq("id", existing.id);
  } else {
    await supabase.from("overtime_settings").insert({ ...data, department_id: departmentId });
  }

  revalidatePath("/settings/overtime");
  return { success: true };
}
