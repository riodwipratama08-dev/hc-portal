import { createClient } from "@/lib/supabase/server";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage() {
  const supabase = createClient();

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  const { data: positions } = await supabase
    .from("positions")
    .select("*, departments(*)")
    .order("title");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add New Employee</h1>
      <EmployeeForm
        departments={departments ?? []}
        positions={positions ?? []}
      />
    </div>
  );
}
