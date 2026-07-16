"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function checkAdminOrHr() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  if (!emp || (emp.role !== "admin" && emp.role !== "hr")) return null;
  return true;
}

export async function createEmployee(formData: FormData) {
  if (!(await checkAdminOrHr())) return { error: "Unauthorized — only Admin/HR can create employees" };
  const supabase = createClient();

  const employeeData = {
    employee_code: formData.get("employee_code") as string,
    full_name: formData.get("full_name") as string,
    nickname: (formData.get("nickname") as string) || null,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: (formData.get("address") as string) || null,
    department_id: formData.get("department_id") as string,
    position_id: formData.get("position_id") as string,
    join_date: formData.get("join_date") as string,
    status: (formData.get("status") as string) || "active",
    role: (formData.get("role") as string) || "employee",
  };

  const { error } = await supabase.from("employees").insert(employeeData);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: string, formData: FormData) {
  if (!(await checkAdminOrHr())) return { error: "Unauthorized — only Admin/HR can update employees" };
  const supabase = createClient();

  const employeeData = {
    employee_code: formData.get("employee_code") as string,
    full_name: formData.get("full_name") as string,
    nickname: (formData.get("nickname") as string) || null,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: (formData.get("address") as string) || null,
    department_id: formData.get("department_id") as string,
    position_id: formData.get("position_id") as string,
    join_date: formData.get("join_date") as string,
    status: formData.get("status") as string,
    role: formData.get("role") as string,
  };

  const { error } = await supabase
    .from("employees")
    .update(employeeData)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export async function resignEmployee(id: string) {
  if (!(await checkAdminOrHr())) return { error: "Unauthorized — only Admin/HR can modify employees" };
  const supabase = createClient();

  const { error } = await supabase
    .from("employees")
    .update({ status: "resigned" })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employees");
}
