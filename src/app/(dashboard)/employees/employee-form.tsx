"use client";

import { useState, useTransition } from "react";
import { createEmployee, updateEmployee } from "./actions";
import { Department, Position } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PositionWithDept extends Position {
  departments?: { name: string };
}

export function EmployeeForm({
  departments,
  positions,
  defaultValues,
}: {
  departments: Department[];
  positions: PositionWithDept[];
  defaultValues?: {
    id?: string;
    employee_code: string;
    full_name: string;
    nickname: string;
    email: string;
    phone: string;
    address: string;
    department_id: string;
    position_id: string;
    join_date: string;
    status: string;
    role: string;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result;
      if (defaultValues?.id) {
        result = await updateEmployee(defaultValues.id, formData);
      } else {
        result = await createEmployee(formData);
      }
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_code">
                Employee Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employee_code"
                name="employee_code"
                required
                defaultValue={defaultValues?.employee_code}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={defaultValues?.email}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              name="full_name"
              required
              defaultValue={defaultValues?.full_name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={defaultValues?.nickname ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                required
                defaultValue={defaultValues?.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join_date">
                Join Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="join_date"
                name="join_date"
                type="date"
                required
                defaultValue={defaultValues?.join_date}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={defaultValues?.address ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department_id">
                Department <span className="text-destructive">*</span>
              </Label>
              <select
                id="department_id"
                name="department_id"
                required
                defaultValue={defaultValues?.department_id ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position_id">
                Position <span className="text-destructive">*</span>
              </Label>
              <select
                id="position_id"
                name="position_id"
                required
                defaultValue={defaultValues?.position_id ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select position</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.departments ? ` (${p.departments.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status & Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                required
                defaultValue={defaultValues?.status ?? "active"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="active">Active</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                required
                defaultValue={defaultValues?.role ?? "employee"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : defaultValues?.id
              ? "Update Employee"
              : "Create Employee"}
        </Button>
        <Button variant="outline" asChild>
          <a href="/employees">Cancel</a>
        </Button>
      </div>
    </form>
  );
}
