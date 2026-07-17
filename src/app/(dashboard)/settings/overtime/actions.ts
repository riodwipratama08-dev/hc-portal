"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isWriteAllowed } from "@/lib/rbac";

export async function updateOvertimeSetting(departmentId: string, minimumMinutes: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  if (!emp || !isWriteAllowed(emp.role)) return { error: "Unauthorized" };

  const { data: existing } = await supabase.from("overtime_settings").select("id").eq("department_id", departmentId).maybeSingle();

  if (existing) {
    await supabase.from("overtime_settings").update({ minimum_overtime_minutes: minimumMinutes }).eq("id", existing.id);
  } else {
    await supabase.from("overtime_settings").insert({ department_id: departmentId, minimum_overtime_minutes: minimumMinutes });
  }

  revalidatePath("/settings/overtime");
  return { success: true };
}
