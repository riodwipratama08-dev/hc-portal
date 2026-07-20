"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

async function checkAdminOrHr() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  return emp && (emp.role === "admin" || emp.role === "hr");
}

export async function updateDepartment(id: string, name: string) {
  if (!(await checkAdminOrHr())) return { error: "Unauthorized" };
  const supabase = createClient();
  const code = name.substring(0, 3).toUpperCase();
  const { error } = await supabase.from("departments").update({ name, code }).eq("id", id);
  if (error) return { error: error.message };
  await logAudit("update_department", "departments", id, { name });
  revalidatePath("/settings/departments");
  return { success: true };
}

export async function createDepartment(name: string) {
  if (!(await checkAdminOrHr())) return { error: "Unauthorized" };
  const supabase = createClient();
  const code = name.substring(0, 3).toUpperCase();
  const { error } = await supabase.from("departments").insert({ name, code });
  if (error) return { error: error.message };
  await logAudit("create_department", "departments", null, { name });
  revalidatePath("/settings/departments");
  return { success: true };
}

export async function deleteDepartment(id: string) {
  if (!(await checkAdminOrHr())) return { error: "Unauthorized" };
  const supabase = createClient();

  // Check if any employees still reference this department
  const { count: empCount } = await supabase.from("employees").select("id", { count: "exact", head: true }).eq("department_id", id);
  if (empCount && empCount > 0) {
    return { error: `Cannot delete: ${empCount} employee(s) still in this department. Move them first.` };
  }

  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit("delete_department", "departments", id, {});
  revalidatePath("/settings/departments");
  return { success: true };
}
