import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentEmployee() {
  const supabase = createClient();

  let user;
  try { user = (await supabase.auth.getUser()).data.user; } catch { /* session error */ }

  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("id, role, full_name, email, department_id")
    .eq("email", user.email)
    .single();

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  return employee;
}

export type CurrentEmployee = Awaited<ReturnType<typeof getCurrentEmployee>>;
