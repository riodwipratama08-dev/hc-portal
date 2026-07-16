import { getCurrentEmployee } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmployeeTable } from "./employee-table";
import { EmployeeWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EmployeesPage(props: {
  searchParams?: Promise<{ search?: string; department_id?: string }>;
}) {
  const supabase = createClient();
  const employee = await getCurrentEmployee();
  const searchParams = await props.searchParams;

  // Employee role → deny completely
  if (employee.role === "employee") {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Hanya Admin, HR, dan Manager yang dapat mengakses halaman ini.</div>;
  }

  const isAdminOrHr = employee.role === "admin" || employee.role === "hr";
  const isManager = employee.role === "manager";

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  let query = supabase
    .from("employees")
    .select("*, departments(*), positions(*)")
    .order("full_name");

  // Manager: only see same department
  if (isManager) {
    query = query.eq("department_id", employee.department_id);
  }

  if (searchParams?.search) {
    const search = `%${searchParams.search}%`;
    query = query.or(
      `full_name.ilike.${search},employee_code.ilike.${search},email.ilike.${search}`
    );
  }

  if (searchParams?.department_id && isAdminOrHr) {
    query = query.eq("department_id", searchParams.department_id);
  }

  const { data: employees } = (await query) as {
    data: EmployeeWithRelations[] | null;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        {isAdminOrHr && (
          <a
            href="/employees/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Employee
          </a>
        )}
      </div>

      <EmployeeTable
        employees={employees ?? []}
        departments={departments ?? []}
        currentSearch={searchParams?.search ?? ""}
        currentDepartmentId={searchParams?.department_id ?? ""}
        isAdminOrHr={isAdminOrHr}
      />
    </div>
  );
}
