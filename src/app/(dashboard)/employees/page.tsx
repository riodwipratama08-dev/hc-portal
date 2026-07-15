import { createClient } from "@/lib/supabase/server";
import { EmployeeTable } from "./employee-table";
import { EmployeeWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EmployeesPage(props: {
  searchParams?: Promise<{ search?: string; department_id?: string }>;
}) {
  const supabase = createClient();
  const searchParams = await props.searchParams;

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  let query = supabase
    .from("employees")
    .select("*, departments(*), positions(*)")
    .order("full_name");

  if (searchParams?.search) {
    const search = `%${searchParams.search}%`;
    query = query.or(
      `full_name.ilike.${search},employee_code.ilike.${search},email.ilike.${search}`
    );
  }

  if (searchParams?.department_id) {
    query = query.eq("department_id", searchParams.department_id);
  }

  const { data: employees } = (await query) as {
    data: EmployeeWithRelations[] | null;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <a
          href="/employees/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add Employee
        </a>
      </div>

      <EmployeeTable
        employees={employees ?? []}
        departments={departments ?? []}
        currentSearch={searchParams?.search ?? ""}
        currentDepartmentId={searchParams?.department_id ?? ""}
      />
    </div>
  );
}
