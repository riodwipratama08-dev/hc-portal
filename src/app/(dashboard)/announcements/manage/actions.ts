"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function checkAdminOrHr() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: emp } = await supabase.from("employees").select("id, role").eq("email", user.email).single();
  if (!emp || (emp.role !== "admin" && emp.role !== "hr")) return null;
  return emp;
}

export async function createAnnouncement(formData: FormData) {
  const emp = await checkAdminOrHr();
  if (!emp) return { error: "Unauthorized" };
  const supabase = createClient();

  const { error } = await supabase.from("announcements").insert({
    title: formData.get("title"),
    content: formData.get("content"),
    created_by: emp.id,
    is_pinned: formData.get("is_pinned") === "on",
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/announcements/manage");
  return { success: true };
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const emp = await checkAdminOrHr();
  if (!emp) return { error: "Unauthorized" };
  const supabase = createClient();

  const { error } = await supabase.from("announcements").update({
    title: formData.get("title"),
    content: formData.get("content"),
    is_pinned: formData.get("is_pinned") === "on",
    is_active: formData.get("is_active") === "on",
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/announcements/manage");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const emp = await checkAdminOrHr();
  if (!emp) return { error: "Unauthorized" };
  const supabase = createClient();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/announcements/manage");
}
