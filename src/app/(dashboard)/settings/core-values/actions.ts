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

// --- Core Value Items ---

export async function createCoreValue(formData: FormData) {
  if (!(await checkAdmin())) return { error: "Unauthorized" };
  const supabase = createClient();
  const { error } = await supabase.from("company_core_values").insert({
    title: formData.get("title"), description: formData.get("description"),
    icon: formData.get("icon") || "✨", display_order: parseInt(formData.get("display_order") as string) || 0,
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
    title: formData.get("title"), description: formData.get("description"),
    icon: formData.get("icon") || "✨", display_order: parseInt(formData.get("display_order") as string) || 0,
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

// --- Core Values Settings (singleton) ---

export async function updateCoreValuesSettings(formData: FormData) {
  if (!(await checkAdmin())) return { error: "Unauthorized" };
  const supabase = createClient();

  const { data: existing } = await supabase.from("core_values_settings").select("id").limit(1).maybeSingle();

  const data = {
    company_name: formData.get("company_name"),
    hero_title: formData.get("hero_title"),
    hero_description: formData.get("hero_description"),
    banner_image_url: formData.get("banner_image_url") || null,
  };

  if (existing) {
    await supabase.from("core_values_settings").update(data).eq("id", existing.id);
  } else {
    await supabase.from("core_values_settings").insert(data);
  }

  revalidatePath("/");
  revalidatePath("/settings/core-values");
  return { success: true };
}
