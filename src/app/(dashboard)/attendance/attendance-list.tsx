"use client";

import { useCallback, useState, useTransition } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { recordOvertime } from "./actions";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

function fmtTime(t: string | null): string {
  if (!t) return "-";
  return t.slice(0, 5);
}

function statusBadgeVariant(status: string): "success" | "danger" | "gray" | "orange" {
  switch (status) {
    case "hadir": case "hadir_lembur": return "success";
    case "tidak_hadir": return "danger";
    case "libur_umum": case "libur_rutin": return "gray";
    case "cuti": case "izin": return "orange";
    default: return "gray";
  }
}

function rowClass(status: string): string {
  switch (status) {
    case "libur_rutin": return "bg-gray-100/70";
    case "libur_umum": return "bg-rose-50";
    case "tidak_hadir": return "bg-red-50";
    case "hadir_lembur": return "bg-indigo-50";
    default: return "";
  }
}

const STATUS_LABEL: Record<string, string> = {
  hadir: "Hadir", hadir_lembur: "Hadir (Lbr)", tidak_hadir: "Tidak Hadir",
  libur_umum: "Libur Umum", libur_rutin: "Libur Rutin", cuti: "Cuti", izin: "Izin",
};

interface SortState { sortBy: string; sortDir: string; }

function SortArrow({ column, current }: { column: string; current: SortState }) {
  if (current.sortBy !== column) return null;
  return <span className="ml-1">{current.sortDir === "asc" ? "▲" : "▼"}</span>;
}

function SortableHead({ column, label, current, onClick }: {
  column: string; label: string; current: SortState; onClick: (col: string) => void;
}) {
  const active = current.sortBy === column;
  return (
    <TableHead className={cn("whitespace-nowrap cursor-pointer select-none text-xs hover:bg-muted/50", active && "font-bold text-foreground bg-muted/30")}
      onClick={() => onClick(column)}>
      <span className="text-xs">{label}</span>
      <SortArrow column={column} current={current} />
    </TableHead>
  );
}

function MinuteBadge({ minutes }: { minutes: number }) {
  if (minutes <= 0) return <span className="text-muted-foreground text-xs">-</span>;
  return <span className="inline-block rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-800">{minutes}m</span>;
}

function DatePicker({ value, onChange, highlightDates, label }: {
  value: string; onChange: (v: string) => void; highlightDates: Date[]; label: string;
}) {
  const date = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-9 w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd MMM yyyy") : "Pilih tanggal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
            highlightDates={highlightDates}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function AttendanceList({
  attendance, role, departments,
  currentStartDate, currentEndDate, currentDepartmentId, currentStatus,
  sortBy, sortDir, canViewAll, showOtButton, dateRangeText, availableDates,
}: {
  attendance: any[]; role: string; departments: any[];
  currentStartDate: string; currentEndDate: string;
  currentDepartmentId: string; currentStatus: string;
  sortBy: string; sortDir: string;
  canViewAll?: boolean; showOtButton?: boolean; dateRangeText?: string; availableDates?: string[];
}) {
  const isWriteAccess = role === "admin" || role === "hr";
  const isManager = role === "manager";

  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [otFormId, setOtFormId] = useState<string | null>(null);
  const [otError, setOtError] = useState<string | null>(null);
  const [otSuccess, setOtSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const highlightDates = (availableDates ?? []).map((d) => new Date(d + "T00:00:00"));

  const buildUrl = useCallback((overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    // Preserve tab param from current URL (for manager split view)
    try { const pTab = new URLSearchParams(window.location.search).get("tab"); if (pTab) p.set("tab", pTab); } catch {}
    if (currentStartDate) p.set("start_date", currentStartDate);
    if (currentEndDate) p.set("end_date", currentEndDate);
    if (currentDepartmentId) p.set("department_id", currentDepartmentId);
    if (currentStatus) p.set("status", currentStatus);
    const finalSortBy = overrides.sort_by !== undefined ? overrides.sort_by : sortBy;
    const finalSortDir = overrides.sort_dir !== undefined ? overrides.sort_dir : sortDir;
    if (finalSortBy) p.set("sort_by", finalSortBy);
    if (finalSortDir) p.set("sort_dir", finalSortDir);
    return `/attendance?${p.toString()}`;
  }, [currentStartDate, currentEndDate, currentDepartmentId, currentStatus, sortBy, sortDir]);

  function handleSort(column: string) {
    let nextDir = "asc";
    if (sortBy === column) nextDir = sortDir === "asc" ? "desc" : "asc";
    window.location.href = buildUrl({ sort_by: column, sort_dir: nextDir });
  }

  function handleFilter() {
    const p = new URLSearchParams();
    try { const pTab = new URLSearchParams(window.location.search).get("tab"); if (pTab) p.set("tab", pTab); } catch {}
    if (startDate) p.set("start_date", startDate);
    if (endDate) p.set("end_date", endDate);
    if (currentDepartmentId) p.set("department_id", currentDepartmentId);
    if (currentStatus) p.set("status", currentStatus);
    if (sortBy) p.set("sort_by", sortBy);
    if (sortDir) p.set("sort_dir", sortDir);
    window.location.href = `/attendance?${p.toString()}`;
  }

  async function handleOvertimeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setOtError(null); setOtSuccess(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordOvertime(formData);
      if (result?.error) { setOtError(result.error); }
      else { setOtSuccess("Lembur tercatat."); setOtFormId(null); window.location.reload(); }
    });
  }

  const sortState: SortState = { sortBy, sortDir };

  return (
    <div>
      {/* Date range info */}
      {dateRangeText && (
        <p className="text-xs text-muted-foreground mb-4 italic">{dateRangeText}</p>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleFilter(); }} className="mb-6 flex flex-wrap gap-4 items-end">
        <DatePicker value={startDate} onChange={setStartDate} highlightDates={highlightDates} label="Start Date" />
        <DatePicker value={endDate} onChange={setEndDate} highlightDates={highlightDates} label="End Date" />
        {(isWriteAccess || role === "executive") && (
          <div>
            <label className="block text-xs font-medium mb-1">Department</label>
            <select name="department_id" defaultValue={currentDepartmentId} onChange={() => handleFilter()}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm">
              <option value="">All</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select name="status" defaultValue={currentStatus} onChange={() => handleFilter()}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm">
            <option value="">All</option><option value="hadir">Hadir</option><option value="hadir_lembur">Hadir (Lembur)</option>
            <option value="tidak_hadir">Tidak Hadir</option><option value="libur_umum">Libur Umum</option>
            <option value="libur_rutin">Libur Rutin</option><option value="cuti">Cuti</option><option value="izin">Izin</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm">Filter</Button>
      </form>

      <div className="rounded-lg border">
        <Table>
          <TableHeader><TableRow>
            <SortableHead column="date" label="Date" current={sortState} onClick={handleSort} />
            <TableHead className="whitespace-nowrap text-xs">NIP</TableHead>
            <SortableHead column="shift_name" label="Nama Shift" current={sortState} onClick={handleSort} />
            <SortableHead column="name" label="Nama" current={sortState} onClick={handleSort} />
            <SortableHead column="status" label="Status" current={sortState} onClick={handleSort} />
            <SortableHead column="check_in" label="Jam Masuk" current={sortState} onClick={handleSort} />
            <SortableHead column="actual_in" label="Absen Masuk" current={sortState} onClick={handleSort} />
            <SortableHead column="late" label="Terlambat" current={sortState} onClick={handleSort} />
            <SortableHead column="check_out" label="Jam Pulang" current={sortState} onClick={handleSort} />
            <SortableHead column="actual_out" label="Absen Pulang" current={sortState} onClick={handleSort} />
            <SortableHead column="early" label="Pulang Awal" current={sortState} onClick={handleSort} />
            <SortableHead column="remarks" label="Keterangan" current={sortState} onClick={handleSort} />
            {isManager && <TableHead className="whitespace-nowrap text-xs">Aksi</TableHead>}
          </TableRow></TableHeader>
          <TableBody>
            {attendance.length === 0 && (
              <TableRow><TableCell colSpan={isManager ? 13 : 12} className="text-center text-muted-foreground py-8 text-xs">No attendance records found.</TableCell></TableRow>
            )}
            {attendance.map((a: any) => {
              const otRecords = a.overtime_records ?? [];
              const hasOT = otRecords.length > 0;
              const showOtLocal = showOtButton && a.status === "hadir" && a.employees?.id;
              return (
                <TableRow key={a.id} className={cn("text-xs", rowClass(a.status))}>
                  <TableCell className="whitespace-nowrap">{a.attendance_date}</TableCell>
                  <TableCell className="font-mono whitespace-nowrap">{a.employees?.employee_code ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{a.shift_name ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{a.employees?.full_name ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={statusBadgeVariant(a.status)} className="text-xs">{STATUS_LABEL[a.status] ?? a.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtTime(a.scheduled_check_in)}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono">{fmtTime(a.actual_check_in)}</TableCell>
                  <TableCell className="text-center whitespace-nowrap"><MinuteBadge minutes={a.late_minutes} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtTime(a.scheduled_check_out)}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono">{fmtTime(a.actual_check_out)}</TableCell>
                  <TableCell className="text-center whitespace-nowrap"><MinuteBadge minutes={a.early_leave_minutes} /></TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {a.remarks ?? "-"}{hasOT && <span className="ml-2"><Badge variant="warning" className="text-[10px]">Lembur (SPV)</Badge></span>}
                  </TableCell>
                  {isManager && (
                    <TableCell className="whitespace-nowrap">
                      {showOtLocal && otFormId !== a.id && (
                        <Button variant="outline" size="sm" className="text-xs h-7"
                          onClick={() => { setOtFormId(a.id); setOtError(null); setOtSuccess(null); }}>
                          Catat Lembur
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {otFormId && (
        <div className="mt-4 rounded-lg border bg-white p-4 max-w-sm">
          <h3 className="text-sm font-semibold mb-3">Catat Lembur</h3>
          <form onSubmit={handleOvertimeSubmit} className="space-y-3">
            <input type="hidden" name="attendance_id" value={otFormId} />
            {(() => { const row = attendance.find((a: any) => a.id === otFormId); return <input type="hidden" name="employee_id" value={row?.employees?.id ?? ""} />; })()}
            <div><label className="block text-xs font-medium mb-1">Menit Lembur (min. 30)</label>
              <Input name="overtime_minutes" type="number" min={30} required className="h-9" placeholder="60" /></div>
            <div><label className="block text-xs font-medium mb-1">Catatan</label>
              <textarea name="notes" rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
            {otError && <p className="text-xs text-destructive">{otError}</p>}
            {otSuccess && <p className="text-xs text-green-600">{otSuccess}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Menyimpan..." : "Simpan"}</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOtFormId(null)}>Batal</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
