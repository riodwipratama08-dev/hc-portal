"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ACTION_LABELS: Record<string, string> = {
  create_employee: "Create Employee", update_employee: "Update Employee", resign_employee: "Resign Employee",
  approve_leave: "Approve Leave", reject_leave: "Reject Leave",
  update_department: "Update Department", create_department: "Create Department", delete_department: "Delete Department",
  create_announcement: "Create Announcement", update_announcement: "Update Announcement", delete_announcement: "Delete Announcement",
  create_core_value: "Create Core Value", update_core_value: "Update Core Value", delete_core_value: "Delete Core Value",
  update_overtime_setting: "Update Overtime Setting", confirm_overtime: "Confirm Overtime",
  import_attendance: "Import Attendance", create_position: "Create Position",
  update_balance: "Update Leave Balance",
};

export function AuditLogViewer({ logs, employees }: { logs: any[]; employees: any[] }) {
  const [filterAction, setFilterAction] = useState("");
  const [filterActor, setFilterActor] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(50);

  const filtered = logs.filter((l) => {
    if (filterAction && l.action !== filterAction) return false;
    if (filterActor && l.actor_id !== filterActor) return false;
    return true;
  }).slice(0, showCount);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).sort();

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div><label className="text-xs font-medium mb-1">Action</label>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-9 rounded-md border border-input px-3 text-xs w-48">
            <option value="">All Actions</option>
            {uniqueActions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>)}
          </select>
        </div>
        <div><label className="text-xs font-medium mb-1">Actor</label>
          <select value={filterActor} onChange={(e) => setFilterActor(e.target.value)} className="h-9 rounded-md border border-input px-3 text-xs w-44">
            <option value="">All Actors</option>
            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setFilterAction(""); setFilterActor(""); }}>Clear</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-xs divide-y">
          <thead className="bg-gray-50"><tr>
            <th className="px-3 py-2 text-left">Time</th><th className="px-3 py-2 text-left">Actor</th>
            <th className="px-3 py-2 text-left">Action</th><th className="px-3 py-2 text-left">Entity</th>
            <th className="px-3 py-2 text-left">Details</th>
          </tr></thead>
          <tbody className="divide-y">
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No logs found.</td></tr>}
            {filtered.map((l: any) => (
              <>
                <tr key={l.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2">{l.employees?.full_name ?? "-"}</td>
                  <td className="px-3 py-2"><Badge variant="gray" className="text-[10px]">{ACTION_LABELS[l.action] ?? l.action}</Badge></td>
                  <td className="px-3 py-2 text-muted-foreground">{l.entity_type}#{l.entity_id?.slice(0, 8) ?? "-"}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{expanded === l.id ? "▲" : "▼"}</td>
                </tr>
                {expanded === l.id && l.metadata && (
                  <tr key={`${l.id}-meta`} className="bg-gray-50">
                    <td colSpan={5} className="px-3 py-2">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(l.metadata, null, 2)}</pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length > showCount && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowCount(showCount + 50)}>Show more ({logs.length - showCount} remaining)</Button>
      )}
    </div>
  );
}
