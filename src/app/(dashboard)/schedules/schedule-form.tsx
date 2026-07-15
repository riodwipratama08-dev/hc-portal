"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchedule, updateSchedule, assignShiftToSchedule } from "./actions";
import { Shift } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export function ScheduleForm({
  defaultValues,
  shifts,
  assignedShiftIds,
}: {
  defaultValues?: {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
  };
  shifts: Shift[];
  assignedShiftIds: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editId] = useState(defaultValues?.id);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result;
      if (editId) {
        result = await updateSchedule(editId, formData);
      } else {
        result = await createSchedule(formData);
      }
      if (result?.error) setError(result.error);
    });
  }

  async function toggleShift(shiftId: string) {
    if (!editId) return;
    const isAssigned = assignedShiftIds.includes(shiftId);
    startTransition(async () => {
      await assignShiftToSchedule(editId, shiftId, isAssigned ? "remove" : "add");
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Edit Schedule" : "New Schedule"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Schedule Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" name="name" required defaultValue={defaultValues?.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={defaultValues?.description ?? ""}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox name="is_active" defaultChecked={defaultValues?.is_active ?? true} />
              Active
            </label>
          </CardContent>
        </Card>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : editId ? "Update Schedule" : "Create Schedule"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/schedules")}>
            Cancel
          </Button>
        </div>
      </form>

      {editId && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Shifts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shifts.length === 0 && (
              <p className="text-sm text-muted-foreground">No shifts available. Create shifts first.</p>
            )}
            {shifts.map((shift) => {
              const checked = assignedShiftIds.includes(shift.id);
              return (
                <label
                  key={shift.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm ${
                    checked
                      ? "border-primary bg-primary/10"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleShift(shift.id)} />
                  <div>
                    <p className="font-medium">{shift.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                    </p>
                  </div>
                </label>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
