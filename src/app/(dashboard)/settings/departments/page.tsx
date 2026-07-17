import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DeptManager } from "./dept-manager";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const supabase = createClient();
  const emp = await getCurrentEmployee().catch(() => null);
  if (!emp || (emp.role !== "admin" && emp.role !== "hr")) {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized</div>;
  }

  const { data: departments } = await supabase.from("departments").select("*").order("name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Departments</h1>
      <DeptManager departments={(departments ?? []) as any[]} />
    </div>
  );
}
