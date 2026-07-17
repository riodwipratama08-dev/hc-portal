"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { confirmOvertime } from "./actions";
import Link from "next/link";

export function OvertimeView({
  candidates, history, currentUserId, activeTab, deptMinMap,
}: {
  candidates: any[]; history: any[]; currentUserId: string;
  activeTab: string; deptMinMap: Record<string, any>;
}) {
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [otMinutes, setOtMinutes] = useState("");
  const [otNotes, setOtNotes] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Group candidates by person
  const peopleMap = new Map<string, { emp: any; items: any[] }>();
  for (const c of candidates) {
    const key = c.employees?.id || "unknown";
    if (!peopleMap.has(key)) peopleMap.set(key, { emp: c.employees, items: [] });
    peopleMap.get(key)!.items.push(c);
  }
  const peopleList = Array.from(peopleMap.values());

  async function handleConfirm(attendanceId: string, employeeId: string) {
    const minutes = parseInt(otMinutes, 10);
    const deptId = candidates.find((c: any) => c.id === attendanceId)?.employees?.department_id;
    const cfg = deptId ? (deptMinMap[deptId] ?? { min: 30 }) : { min: 30 };
    if (isNaN(minutes) || minutes < cfg.min) { setError(`Must be at least ${cfg.min} minutes.`); return; }
    setError(""); startTransition(async () => {
      const r = await confirmOvertime(attendanceId, employeeId, minutes, otNotes);
      if (r?.error) setError(r.error); else { setConfirmId(null); setOtMinutes(""); setOtNotes(""); window.location.reload(); }
    });
  }

  return (
    <div>
      <div className="flex gap-4 border-b pb-2 mb-6">
        <Link href="/overtime?tab=candidates" className={`text-sm font-medium pb-1 border-b-2 ${activeTab === "candidates" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500"}`}>
          Candidates ({peopleList.length})
        </Link>
        <Link href="/overtime?tab=history" className={`text-sm font-medium pb-1 border-b-2 ${activeTab === "history" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500"}`}>
          History ({history.length})
        </Link>
      </div>

      {activeTab === "candidates" && (
        <div className="space-y-3">
          {peopleList.length === 0 && <p className="text-sm text-muted-foreground">No overtime candidates found.</p>}
          {peopleList.map(({ emp, items }) => {
            const isOpen = expandedPerson === emp?.id;
            const deptName = emp?.departments?.name || "";
            const deptCfg = emp?.department_id ? (deptMinMap[emp.department_id] ?? {}) : {};
            const stillPending = items.filter((i: any) => !i._confirmed).length;
            return (
              <Card key={emp?.id} className={isOpen ? "border-teal-300" : ""}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedPerson(isOpen ? null : emp?.id)}>
                    <div className="text-sm">
                      <p className="font-medium">{emp?.full_name} ({emp?.employee_code})</p>
                      <p className="text-xs text-muted-foreground">{deptName} — {stillPending} day(s) with overtime potential</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{stillPending} pending</Badge>
                      <span className="text-xs text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {items.map((c: any) => (
                        <div key={c.id}>
                          {confirmId === c.id ? (
                            <div className="bg-gray-50 rounded p-3 space-y-2">
                              <p className="text-xs text-muted-foreground">{c.attendance_date} · {c.shift_name}</p>
                              <p className="text-xs">Schedule: {c.scheduled_check_in?.slice(0,5)}-{c.scheduled_check_out?.slice(0,5)} | Actual: {c.actual_check_in?.slice(0,5)}-{c.actual_check_out?.slice(0,5)}</p>
                              <div className="flex items-center gap-3">
                                <div><label className="text-xs font-medium">Minutes</label>
                                  <Input type="number" value={otMinutes} onChange={(e) => setOtMinutes(e.target.value)} className="w-24 h-8 text-sm" /></div>
                                <div className="flex-1"><label className="text-xs font-medium">Notes</label>
                                  <Input value={otNotes} onChange={(e) => setOtNotes(e.target.value)} placeholder="(optional)" className="h-8 text-sm" /></div>
                              </div>
                              {error && <p className="text-xs text-red-600">{error}</p>}
                              <div className="flex gap-2">
                                <Button size="sm" disabled={isPending} onClick={() => handleConfirm(c.id, c.employees?.id)}>Confirm</Button>
                                <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                              <span className="text-muted-foreground">{c.attendance_date}</span>
                              <span>{c.scheduled_check_in?.slice(0,5)}-{c.scheduled_check_out?.slice(0,5)} → {c.actual_check_in?.slice(0,5)}-{c.actual_check_out?.slice(0,5)}</span>
                              <span className="text-yellow-700 font-medium">
                                {c._ot.earlyMinutes >= 60 && `${c._ot.earlyMinutes}m early `}
                                {c._ot.lateMinutes >= (deptCfg.min ?? 30) && `${c._ot.lateMinutes}m late`}
                              </span>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); setConfirmId(c.id); setOtMinutes(String(Math.max(c._ot.earlyMinutes, c._ot.lateMinutes, (deptCfg.min ?? 30)))); }}>Confirm</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
