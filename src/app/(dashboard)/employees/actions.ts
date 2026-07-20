"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

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

  await logAudit("create_employee", "employees", null, { employee_code: employeeData.employee_code, full_name: employeeData.full_name, role: employeeData.role });
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

  await logAudit("update_employee", "employees", id, { role: employeeData.role, status: employeeData.status, full_name: employeeData.full_name });
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

  await logAudit("resign_employee", "employees", id, { status: "resigned" });
  revalidatePath("/employees");
}

export async function resetPassword(employeeId: string, email: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  if (!emp || emp.role !== "admin") return { error: "Only admin can reset passwords." };

  const newPassword = "Malilkids" + Math.random().toString(36).slice(2, 8) + "!";
  const adm = createAdminClient();
  const { error } = await adm.auth.admin.updateUserById(employeeId, { password: newPassword });
  if (error) return { error: error.message };

  await logAudit("reset_password", "employees", employeeId, { email });
  revalidatePath("/employees");
  return { success: true, password: newPassword };
}

export async function toggleSuspend(employeeId: string, email: string, suspend: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  if (!emp || emp.role !== "admin") return { error: "Only admin can suspend accounts." };

  const adm = createAdminClient();
  if (suspend) {
    const { error } = await adm.auth.admin.updateUserById(employeeId, { ban_duration: "876000h" });
    if (error) return { error: error.message };
    await logAudit("suspend_account", "employees", employeeId, { email });
  } else {
    const { error } = await adm.auth.admin.updateUserById(employeeId, { ban_duration: "none" });
    if (error) return { error: error.message };
    await logAudit("unsuspend_account", "employees", employeeId, { email });
  }

  revalidatePath("/employees");
  return { success: true };
}
