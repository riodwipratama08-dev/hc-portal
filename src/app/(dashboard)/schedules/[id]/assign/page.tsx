import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AssignForm } from "./assign-form";

export default async function AssignSchedulePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createClient();

  const { data: schedule } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", id)
    .single();

  if (!schedule) notFound();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, employee_code, departments(name)")
    .eq("status", "active")
    .order("full_name");

  const { data: assignments } = await supabase
    .from("employee_schedules")
    .select("*, employees(full_name, employee_code)")
    .eq("schedule_id", id)
    .is("effective_end", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Assign Schedule</h1>
      <p className="mb-6 text-sm text-gray-500">
        Schedule: <span className="font-medium">{schedule.name}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Assign to Employee
          </h2>
          <AssignForm
            scheduleId={id}
            employees={employees ?? []}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">
            Currently Assigned
          </h2>
          <div className="rounded-lg border">
            {(assignments ?? []).length === 0 && (
              <p className="p-4 text-sm text-gray-400">
                No employees assigned to this schedule.
              </p>
            )}
            {(assignments ?? []).map((a: any) => (
              <div
                key={a.id}
                className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {a.employees?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.employees?.employee_code} &middot; Since{" "}
                    {a.effective_start}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
