import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EmployeeForm } from "../../employee-form";

export default async function EditEmployeePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (!employee) {
    notFound();
  }

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
      <h1 className="mb-6 text-2xl font-bold">Edit Employee</h1>
      <p className="mb-4 text-sm text-gray-500">
        Editing: {employee.full_name} ({employee.employee_code})
      </p>
      <EmployeeForm
        departments={departments ?? []}
        positions={positions ?? []}
        defaultValues={{
          id: employee.id,
          employee_code: employee.employee_code,
          full_name: employee.full_name,
          nickname: employee.nickname ?? "",
          email: employee.email,
          phone: employee.phone,
          address: employee.address ?? "",
          department_id: employee.department_id,
          position_id: employee.position_id,
          join_date: employee.join_date,
          status: employee.status,
          role: employee.role,
        }}
      />
    </div>
  );
}
