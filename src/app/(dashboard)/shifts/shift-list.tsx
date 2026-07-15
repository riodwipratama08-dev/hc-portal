"use client";

import { Shift } from "@/lib/types";
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

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

export function ShiftList({ shifts }: { shifts: Shift[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No shifts defined.
              </TableCell>
            </TableRow>
          )}
          {shifts.map((shift) => (
            <TableRow key={shift.id}>
              <TableCell className="font-medium">{shift.name}</TableCell>
              <TableCell>{shift.start_time.slice(0, 5)}</TableCell>
              <TableCell>{shift.end_time.slice(0, 5)}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {(shift.applicable_days as string[]).map((d) => (
                    <span
                      key={d}
                      className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                    >
                      {DAY_LABELS[d] ?? d}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={shift.is_active ? "success" : "gray"}>
                  {shift.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/shifts/${shift.id}/edit`}>Edit</a>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
