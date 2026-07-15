"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { approveLeave, rejectLeave } from "../actions";

function statusVariant(s: string): "success" | "danger" | "gray" | "orange" {
  switch (s) {
    case "approved": return "success";
    case "rejected": return "danger";
    default: return "orange";
  }
}

export function LeaveDetail({
  request, approvals, isApprover, currentUserId,
}: {
  request: any;
  approvals: any[];
  isApprover: boolean;
  currentUserId: string;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  async function handleApprove() {
    setError(null);
    startTransition(async () => {
      const r = await approveLeave(request.id, notes);
      if (r?.error) setError(r.error);
      else setDone(true);
    });
  }

  async function handleReject() {
    setError(null);
    startTransition(async () => {
      const r = await rejectLeave(request.id, notes);
      if (r?.error) setError(r.error);
      else setDone(true);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>{request.employees?.full_name} — {request.custom_reason_label || request.leave_reasons?.label}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-muted-foreground">Start:</span> {request.start_date}{request.start_time ? ` ${request.start_time}` : ""}</div>
            <div><span className="text-muted-foreground">End:</span> {request.end_date}{request.end_time ? ` ${request.end_time}` : ""}</div>
            <div><span className="text-muted-foreground">Category:</span> {request.leave_reasons?.leave_categories?.name}</div>
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <Badge variant={statusVariant(request.status)} className="capitalize">{request.status}</Badge>
            </div>
          </div>
          {request.additional_notes && (
            <div><span className="text-muted-foreground">Notes:</span> {request.additional_notes}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Approval Status</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {approvals.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between border rounded p-3 text-sm">
                <div>
                  <p className="font-medium">{a.employees?.full_name}</p>
                  <p className="text-xs text-muted-foreground">Level {a.level}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(a.status)} className="capitalize">{a.status}</Badge>
                  {a.notes && <span className="text-xs text-muted-foreground">— {a.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isApprover && !done && request.status === "pending" && (
        <Card>
          <CardHeader><CardTitle>Your Decision</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Catatan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button variant="default" onClick={handleApprove} disabled={isPending}>Approve</Button>
              <Button variant="destructive" onClick={handleReject} disabled={isPending}>Reject</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
