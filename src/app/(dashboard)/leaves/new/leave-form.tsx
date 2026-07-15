"use client";

import { useState, useTransition } from "react";
import { createLeaveRequest } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReasonWithCategory extends Record<string, any> {
  id: string;
  label: string;
  is_active: boolean;
}

export function LeaveForm({ categories }: { categories: any[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const selectedCategory = categories.find((c: any) => c.id === selectedCategoryId);
  const reasons: ReasonWithCategory[] = (selectedCategory?.leave_reasons ?? []).filter((r: any) => r.is_active);
  const needsTime = selectedCategory?.name?.toLowerCase().includes("terlambat") ||
    selectedCategory?.name?.toLowerCase().includes("pulang awal");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createLeaveRequest(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Leave Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kategori <span className="text-destructive">*</span></Label>
            <select name="category_id" required value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(e.target.value); setSelectedReasonId(""); setShowCustom(false); }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Select category...</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCategoryId && (
            <div className="space-y-2">
              <Label>Alasan <span className="text-destructive">*</span></Label>
              <select name="reason_id" value={selectedReasonId}
                onChange={(e) => { setSelectedReasonId(e.target.value); setShowCustom(e.target.value === "_custom"); }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">Select reason...</option>
                {reasons.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
                <option value="_custom">Lainnya (tulis sendiri)</option>
              </select>
            </div>
          )}

          {showCustom && (
            <div className="space-y-2">
              <Label>Custom Reason <span className="text-destructive">*</span></Label>
              <Input name="custom_reason_label" required placeholder="Tulis alasan sendiri..." />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Input name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>End Date <span className="text-destructive">*</span></Label>
              <Input name="end_date" type="date" required />
            </div>
          </div>

          {needsTime && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input name="start_time" type="time" />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input name="end_time" type="time" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <textarea name="additional_notes" rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "Submitting..." : "Ajukan"}</Button>
        <Button type="button" variant="outline" asChild><a href="/leaves">Cancel</a></Button>
      </div>
    </form>
  );
}
