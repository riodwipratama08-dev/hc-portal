"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  revalidatePath("/settings/departments");
  return { success: true };
}

export async function createDepartment(name: string) {
  if (!(await checkAdminOrHr())) return { error: "Unauthorized" };
  const supabase = createClient();
  const code = name.substring(0, 3).toUpperCase();
  const { error } = await supabase.from("departments").insert({ name, code });
  if (error) return { error: error.message };
  revalidatePath("/settings/departments");
  return { success: true };
}
