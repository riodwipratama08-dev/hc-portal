import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardHome() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("email", user.email)
    .single();

  if (employee?.role === "admin" || employee?.role === "hr") {
    redirect("/employees");
  }

  redirect("/attendance");
}
