"use client";

import { useState } from "react";
import { EmployeeWithRelations, Department } from "@/lib/types";
import { resignEmployee } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function statusVariant(status: string): "success" | "warning" | "danger" {
  switch (status) {
    case "active":
      return "success";
    case "resigned":
      return "warning";
    case "terminated":
      return "danger";
    default:
      return "warning";
  }
}

function roleVariant(role: string): "default" | "secondary" | "outline" | "destructive" {
  switch (role) {
    case "admin":
      return "destructive";
    case "hr":
      return "default";
    case "manager":
      return "secondary";
    default:
      return "outline";
  }
}

export function EmployeeTable({
  employees,
  departments,
  currentSearch,
  currentDepartmentId,
  isAdminOrHr,
}: {
  employees: EmployeeWithRelations[];
  departments: Department[];
  currentSearch: string;
  currentDepartmentId: string;
  isAdminOrHr: boolean;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const search = (form.elements.namedItem("search") as HTMLInputElement).value;
    const department_id = (
      form.elements.namedItem("department_id") as HTMLSelectElement
    ).value;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (department_id) params.set("department_id", department_id);
    window.location.href = `/employees?${params.toString()}`;
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label htmlFor="search" className="block text-xs font-medium mb-1">
            Search
          </label>
          <Input
            id="search"
            name="search"
            type="text"
            defaultValue={currentSearch}
            placeholder="Name, code, or email..."
            className="w-64 h-9"
          />
        </div>
        <div>
          <label htmlFor="department_id" className="block text-xs font-medium mb-1">
            Department
          </label>
          <select
            id="department_id"
            name="department_id"
            defaultValue={currentDepartmentId}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {isAdminOrHr && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdminOrHr ? 8 : 7} className="text-center text-muted-foreground py-8">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-mono text-xs">{emp.employee_code}</TableCell>
                <TableCell className="font-medium">{emp.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                <TableCell>{emp.departments?.name}</TableCell>
                <TableCell>{emp.positions?.title}</TableCell>
                <TableCell>
                  <Badge variant={roleVariant(emp.role)} className="capitalize">
                    {emp.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(emp.status)}>
                    {emp.status}
                  </Badge>
                </TableCell>
                {isAdminOrHr && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/employees/${emp.id}/edit`}>Edit</a>
                      </Button>
                      {emp.status === "active" && (
                        <>
                          {confirmId === emp.id ? (
                            <span className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  await resignEmployee(emp.id);
                                  window.location.reload();
                                }}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmId(emp.id)}
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                              Resign
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
