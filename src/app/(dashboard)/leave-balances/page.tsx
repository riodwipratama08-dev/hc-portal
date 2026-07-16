import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BalanceList } from "./balance-list";

export const dynamic = "force-dynamic";

export default async function LeaveBalancesPage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee().catch(() => null);
  if (!emp || (emp.role !== "admin" && emp.role !== "hr")) {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin & HR can access.</div>;
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, employee_code, departments(name)")
    .eq("status", "active")
    .order("full_name");

  const { data: categories } = await supabase
    .from("leave_categories")
    .select("*")
    .eq("affects_payroll_or_attendance", true)
    .eq("is_active", true)
    .order("name");

  const { data: balances } = await supabase
    .from("leave_balances")
    .select("*, leave_categories(name)")
    .order("year", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Leave Balances</h1>
      <BalanceList
        employees={(employees ?? []) as any[]}
        categories={(categories ?? []) as any[]}
        balances={(balances ?? []) as any[]}
      />
    </div>
  );
}
