import { createClient } from "@/lib/supabase/server";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";

export default async function ImportAttendancePage() {
  const supabase = createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_code, full_name")
    .eq("status", "active");

  const employeeMap = (employees ?? []).reduce(
    (acc: Record<string, { id: string; full_name: string }>, e: any) => {
      acc[e.employee_code] = { id: e.id, full_name: e.full_name };
      return acc;
    },
    {}
  );

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Import Attendance CSV</h1>
      <p className="mb-6 text-sm text-gray-500">
        Upload CSV file exported from fingerprint machine (delimiter: semicolon)
      </p>
      <ImportForm employeeMap={employeeMap} />
    </div>
  );
}
