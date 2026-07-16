"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function checkAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  return emp?.role === "admin";
}

export async function createCoreValue(formData: FormData) {
  if (!(await checkAdmin())) return { error: "Unauthorized" };
  const supabase = createClient();

  const { error } = await supabase.from("company_core_values").insert({
    title: formData.get("title"),
    description: formData.get("description"),
    icon: formData.get("icon") || "🌟",
    display_order: parseInt(formData.get("display_order") as string) || 0,
    is_active: formData.get("is_active") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/settings/core-values");
  return { success: true };
}

export async function updateCoreValue(id: string, formData: FormData) {
  if (!(await checkAdmin())) return { error: "Unauthorized" };
  const supabase = createClient();

  const { error } = await supabase.from("company_core_values").update({
    title: formData.get("title"),
    description: formData.get("description"),
    icon: formData.get("icon") || "🌟",
    display_order: parseInt(formData.get("display_order") as string) || 0,
    is_active: formData.get("is_active") === "on",
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/settings/core-values");
  return { success: true };
}

export async function deleteCoreValue(id: string) {
  if (!(await checkAdmin())) return { error: "Unauthorized" };
  const supabase = createClient();
  await supabase.from("company_core_values").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/settings/core-values");
}
