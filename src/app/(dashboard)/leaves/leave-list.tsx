"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function statusVariant(s: string): "success" | "danger" | "gray" | "orange" {
  switch (s) {
    case "approved": return "success";
    case "rejected": return "danger";
    case "cancelled": return "gray";
    default: return "orange";
  }
}

function approvalBadge(a: any) {
  if (a.status === "approved") return <Badge variant="success" className="text-[10px]">✓</Badge>;
  if (a.status === "rejected") return <Badge variant="danger" className="text-[10px]">✗</Badge>;
  return <Badge variant="gray" className="text-[10px]">…</Badge>;
}

export function LeaveList({ requests, currentUserId, currentStatus }: {
  requests: any[];
  currentUserId: string;
  currentStatus: string;
}) {
  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const status = (e.currentTarget.elements.namedItem("status") as HTMLSelectElement)?.value;
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    window.location.href = `/leaves?${p.toString()}`;
  }

  return (
    <div>
      <form onSubmit={handleFilter} className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select name="status" defaultValue={currentStatus}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button type="submit" className="rounded-md bg-gray-800 px-4 py-2 text-xs text-white">Filter</button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Employee</TableHead>
              <TableHead className="text-xs">Reason</TableHead>
              <TableHead className="text-xs">Dates</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Approvals</TableHead>
              <TableHead className="text-xs">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">No requests found.</TableCell></TableRow>
            )}
            {requests.map((r: any) => (
              <TableRow key={r.id} className="text-xs">
                <TableCell className="whitespace-nowrap font-medium">
                  {r.employees?.full_name ?? "-"}
                  <div className="text-muted-foreground">{r.employees?.employee_code}</div>
                </TableCell>
                <TableCell>{r.custom_reason_label || r.leave_reasons?.label || "-"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {r.start_date}{r.end_date !== r.start_date ? ` → ${r.end_date}` : ""}
                  {r.start_time && <div className="text-muted-foreground">{r.start_time} - {r.end_time}</div>}
                </TableCell>
                <TableCell><Badge variant={statusVariant(r.status)} className="text-xs capitalize">{r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {(r.approvals ?? []).map((a: any) => (
                      <span key={a.id} title={`${a.employees?.full_name} (L${a.level})`}>
                        {approvalBadge(a)}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">{r.additional_notes ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
