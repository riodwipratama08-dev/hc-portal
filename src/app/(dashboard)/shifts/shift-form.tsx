"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShift, updateShift } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function ShiftForm({
  defaultValues,
}: {
  defaultValues?: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    applicable_days: string[];
    is_active: boolean;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedDays, setSelectedDays] = useState<string[]>(
    defaultValues?.applicable_days ?? ["monday", "tuesday", "wednesday", "thursday", "friday"]
  );

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    selectedDays.forEach((d) => formData.set(`day_${d}`, "on"));

    startTransition(async () => {
      let result;
      if (defaultValues?.id) {
        result = await updateShift(defaultValues.id, formData);
      } else {
        result = await createShift(formData);
      }
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{defaultValues?.id ? "Edit Shift" : "New Shift"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Shift Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultValues?.name}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                required
                defaultValue={defaultValues?.start_time}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">
                End Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                required
                defaultValue={defaultValues?.end_time}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Applicable Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label
                  key={day.key}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                    selectedDays.includes(day.key)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Checkbox
                    checked={selectedDays.includes(day.key)}
                    onCheckedChange={() => toggleDay(day.key)}
                  />
                  {day.label.slice(0, 3)}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              name="is_active"
              defaultChecked={defaultValues?.is_active ?? true}
            />
            Active
          </label>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : defaultValues?.id ? "Update Shift" : "Create Shift"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/shifts")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
