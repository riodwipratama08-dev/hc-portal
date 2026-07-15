"use client";

import { useState, useTransition } from "react";
import { assignScheduleToEmployee } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AssignForm({
  scheduleId,
  employees,
}: {
  scheduleId: string;
  employees: any[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    const employeeId = formData.get("employee_id") as string;
    const effectiveStart = formData.get("effective_start") as string;

    if (!employeeId || !effectiveStart) {
      setError("Please select an employee and date.");
      return;
    }

    startTransition(async () => {
      const result = await assignScheduleToEmployee(employeeId, scheduleId, effectiveStart);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("Employee assigned successfully!");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign to Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_id">Employee</Label>
            <select
              id="employee_id"
              name="employee_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select employee...</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_code})
                  {emp.departments?.name ? ` - ${emp.departments.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effective_start">Effective Start Date</Label>
            <Input
              id="effective_start"
              name="effective_start"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Assigning..." : "Assign Schedule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
