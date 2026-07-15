"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createShift(formData: FormData) {
  const supabase = createClient();

  const days = [];
  for (const day of ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]) {
    if (formData.get(`day_${day}`) === "on") days.push(day);
  }

  const shiftData = {
    name: formData.get("name") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    applicable_days: days.length > 0 ? days : ["monday","tuesday","wednesday","thursday","friday"],
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase.from("shifts").insert(shiftData);

  if (error) return { error: error.message };

  revalidatePath("/shifts");
  redirect("/shifts");
}

export async function updateShift(id: string, formData: FormData) {
  const supabase = createClient();

  const days = [];
  for (const day of ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]) {
    if (formData.get(`day_${day}`) === "on") days.push(day);
  }

  const shiftData = {
    name: formData.get("name") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    applicable_days: days.length > 0 ? days : ["monday","tuesday","wednesday","thursday","friday"],
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase.from("shifts").update(shiftData).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/shifts");
  redirect("/shifts");
}
