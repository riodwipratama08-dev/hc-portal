"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { confirmOvertime } from "./actions";
import Link from "next/link";

export function OvertimeView({
  candidates, history, currentUserId, activeTab, deptMinMap,
}: {
  candidates: any[]; history: any[]; currentUserId: string;
  activeTab: string; deptMinMap: Record<string, number>;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [otMinutes, setOtMinutes] = useState("");
  const [otNotes, setOtNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleConfirm(attendanceId: string, employeeId: string) {
    const minutes = parseInt(otMinutes, 10);
    const deptId = candidates.find((c: any) => c.id === attendanceId)?.employees?.department_id;
    const minMin = deptId ? (deptMinMap[deptId] ?? 30) : 30;
    if (isNaN(minutes) || minutes < minMin) {
      setError(`Must be at least ${minMin} minutes.`);
      return;
    }
    setError(""); startTransition(async () => {
      const r = await confirmOvertime(attendanceId, employeeId, minutes, otNotes);
      if (r?.error) setError(r.error);
      else { setConfirmId(null); setOtMinutes(""); setOtNotes(""); window.location.reload(); }
    });
  }

  return (
    <div>
      <div className="flex gap-4 border-b pb-2 mb-6">
        <Link href="/overtime?tab=candidates" className={`text-sm font-medium pb-1 border-b-2 ${activeTab === "candidates" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500"}`}>
          Candidates ({candidates.length})
        </Link>
        <Link href="/overtime?tab=history" className={`text-sm font-medium pb-1 border-b-2 ${activeTab === "history" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500"}`}>
          History ({history.length})
        </Link>
      </div>

      {activeTab === "candidates" && (
        <div className="space-y-3">
          {candidates.length === 0 && <p className="text-sm text-muted-foreground">No overtime candidates found.</p>}
          {candidates.map((c: any) => (
            <Card key={c.id} className={confirmId === c.id ? "border-teal-400" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="font-medium">{c.employees?.full_name} ({c.employees?.employee_code})</p>
                    <p className="text-xs text-muted-foreground">{c.attendance_date} · {c.shift_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Schedule: {c.scheduled_check_in?.slice(0,5)}-{c.scheduled_check_out?.slice(0,5)} |
                      Actual: {c.actual_check_in?.slice(0,5)}-{c.actual_check_out?.slice(0,5)}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {c._ot.earlyMinutes >= 60 && <Badge variant="secondary" className="text-[10px]">{c._ot.earlyMinutes}m early</Badge>}
                      {c._ot.lateMinutes >= (deptMinMap[c.employees?.department_id] ?? 30) && <Badge variant="secondary" className="text-[10px]">{c._ot.lateMinutes}m late</Badge>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                    setConfirmId(c.id); setOtMinutes(String(Math.max(c._ot.earlyMinutes, c._ot.lateMinutes, (deptMinMap[c.employees?.department_id] ?? 30))));
                  }}>Confirm</Button>
                </div>
                {confirmId === c.id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-xs font-medium">Minutes</label>
                        <Input type="number" min={(deptMinMap[c.employees?.department_id] ?? 30)} value={otMinutes}
                          onChange={(e) => setOtMinutes(e.target.value)} className="w-24 h-8 text-sm" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium">Notes</label>
                        <Input value={otNotes} onChange={(e) => setOtNotes(e.target.value)} placeholder="(optional)" className="h-8 text-sm" />
                      </div>
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" disabled={isPending} onClick={() => handleConfirm(c.id, c.employees?.id)}>
                        {isPending ? "Saving..." : "Confirm Overtime"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-3">
          {history.length === 0 && <p className="text-sm text-muted-foreground">No confirmed overtime records.</p>}
          {history.map((h: any) => (
            <Card key={h.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{h.attendance?.employees?.full_name} ({h.attendance?.employees?.employee_code})</p>
                    <p className="text-xs text-muted-foreground">{h.attendance?.attendance_date} · {h.attendance?.shift_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" className="text-[10px]">{h.overtime_minutes}m</Badge>
                    {h.notes && <p className="text-xs text-muted-foreground mt-1">{h.notes}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
