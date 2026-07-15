"use client";

import { useState, useTransition, useRef } from "react";
import { confirmImport } from "./actions";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviewRow {
  line: number;
  employee_code: string;
  employee_name: string;
  attendance_date: string;
  _match: boolean;
  _matched_name?: string;
  _status: string;
  _remarks: string;
  _dup: boolean;
  [key: string]: any;
}

const CSV_COLUMNS = [
  "Tanggal","Jadwal","Jam kerja","Valid","PIN","NIP","Nama","Jabatan",
  "Departemen","Kantor","Libur umum","Libur rutin","Lembur","Jam Masuk",
  "Scan masuk","SN scan masuk","Izin terlambat","Terlambat","Scan Istirahat 1",
  "Scan Istirahat 2","Istirahat","Lembur istirahat","Izin pulang awal",
  "Pulang awal","Jam Pulang","Scan pulang","SN scan pulang","Durasi",
  "Dihitung","Lembur akhir","Keterangan"
];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ";" && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function convertDateFormat(dateStr: string): string {
  const trimmed = dateStr.trim();
  const parts = trimmed.split("-");
  if (parts.length === 3 && parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return trimmed;
}

function normalizeTime(val: string): string {
  if (!val || val.trim() === "" || val.trim() === "00:00:00") return "";
  return val.trim();
}

function parseYesNo(val: string): string {
  const v = val?.trim().toLowerCase() ?? "";
  if (v === "y" || v === "yes" || v === "1" || v === "ya" ||
      v === "true" || v === "v" || v === "ok" || v === "✓" || v === "✔") return "1";
  return "0";
}

function isDayOffShift(shiftName: string | null): boolean {
  if (!shiftName) return false;
  const lower = shiftName.toLowerCase().trim();
  const keywords = [
    "libur", "hari raya", "tgl merah", "off", "holiday",
    "idul fitri", "idul adha", "tahun baru", "maulid", "isra", "waisak",
    "nyepi", "kenaikan", "isa almasih", "kemerdekaan", "natal", "imlek",
    "paskah", "kurban", "hijriah", "cuti bersama", "proklamasi",
    "wali", "lahir pancasila",
  ];
  return keywords.some((k) => lower.includes(k));
}

function isSunday(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return false;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.getDay() === 0;
}

function isTidakHadirSchedule(scheduleName: string | null): boolean {
  if (!scheduleName) return false;
  const lower = scheduleName.toLowerCase().trim();
  return lower === "tidak hadir" || lower.includes("tidak hadir");
}

function determineStatusAndRemarks(row: any, attendanceDate: string): { status: string; remarks: string } {
  const actualIn = normalizeTime(row.actual_check_in);
  const actualOut = normalizeTime(row.actual_check_out);
  const shiftIsDayOff = isDayOffShift(row.shift_name);
  const isHoliday = row.is_public_holiday === "1";
  const isRoutineDayOff = row.is_routine_day_off === "1";
  const isAnyDayOff = isHoliday || isRoutineDayOff || shiftIsDayOff;

  if (isHoliday && !actualIn && !actualOut) return { status: "libur_umum", remarks: "Libur Umum" };
  if ((isRoutineDayOff || shiftIsDayOff) && !actualIn && !actualOut) return { status: "libur_rutin", remarks: "Libur" };

  if (isAnyDayOff && actualIn) {
    if (isSunday(attendanceDate)) return { status: "hadir_lembur", remarks: "Hadir (lembur)" };
    return { status: "hadir", remarks: "-" };
  }

  if (isTidakHadirSchedule(row.schedule_name)) return { status: "tidak_hadir", remarks: "Tidak Hadir" };
  if (!actualIn) return { status: "tidak_hadir", remarks: "Tidak scan masuk" };
  if (actualIn && !actualOut) return { status: "tidak_hadir", remarks: "Tidak scan pulang" };
  return { status: "hadir", remarks: "-" };
}

function calcLateMinutes(scheduled: string, actual: string): number {
  const s = normalizeTime(scheduled);
  const a = normalizeTime(actual);
  if (!s || !a) return 0;
  const [sh, sm] = s.split(":").map(Number);
  const [ah, am] = a.split(":").map(Number);
  return Math.max(0, (ah * 60 + am) - (sh * 60 + sm));
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

const STATUS_LABEL: Record<string, string> = {
  hadir: "Hadir", hadir_lembur: "Hadir (Lembur)", tidak_hadir: "Tidak Hadir",
  libur_umum: "Libur Umum", libur_rutin: "Libur Rutin", cuti: "Cuti", izin: "Izin",
};

export function ImportForm({
  employeeMap,
}: { employeeMap: Record<string, { id: string; full_name: string }> }) {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setImportResult(null); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => { parseAndPreview(evt.target?.result as string); };
    reader.readAsText(file);
  }

  function parseAndPreview(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const parsed: PreviewRow[] = [];
    const seen = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 5) continue;
      const nip = cols[4]?.trim() ?? cols[5]?.trim() ?? "";
      const attendanceDate = cols[0]?.trim() ? convertDateFormat(cols[0].trim()) : "";
      const match = employeeMap[nip];
      const dupKey = `${nip}_${attendanceDate}`;
      const isDup = seen.has(dupKey);
      seen.add(dupKey);

      const row: any = {
        line: i + 1, employee_code: nip, employee_name: cols[6]?.trim() ?? "",
        attendance_date: attendanceDate,
        _match: !!match && !isDup, _matched_name: match?.full_name, _dup: isDup,
        _employee_id: match?.id,
        schedule_name: cols[1]?.trim() || null, shift_name: cols[2]?.trim() || null,
        is_valid: !(cols[3]?.trim().toLowerCase() === "tidak" || cols[3]?.trim() === "0"),
        is_public_holiday: parseYesNo(cols[10]) === "1",
        is_routine_day_off: parseYesNo(cols[11]) === "1",
        office_location: cols[9]?.trim() ?? "",
        scheduled_check_in: normalizeTime(cols[13]),
        actual_check_in: normalizeTime(cols[14]),
        check_in_device_sn: cols[15]?.trim() || null,
        late_permission: parseYesNo(cols[16]), late_minutes: cols[17]?.trim() || "0",
        break_check_1: normalizeTime(cols[18]), break_check_2: normalizeTime(cols[19]),
        break_minutes: cols[20]?.trim() || "0", overtime_break_minutes: cols[21]?.trim() || "0",
        early_leave_permission: parseYesNo(cols[22]), early_leave_minutes: cols[23]?.trim() || "0",
        scheduled_check_out: normalizeTime(cols[24]),
        actual_check_out: normalizeTime(cols[25]),
        check_out_device_sn: cols[26]?.trim() || null,
        duration_minutes: cols[27]?.trim() || "0",
        is_counted: parseYesNo(cols[28]), overtime_minutes: cols[29]?.trim() || "0",
        remarks: cols[30]?.trim() || null,
      };

      const { status, remarks: rm } = determineStatusAndRemarks(row, attendanceDate);
      row._status = status; row._remarks = rm;
      row._late = calcLateMinutes(row.scheduled_check_in, row.actual_check_in);
      if (!match) row._match = false;
      parsed.push(row);
    }
    setRows(parsed);
    if (parsed.length === 0) setError("No valid rows found in CSV. Make sure the delimiter is semicolon (;).");
  }

  function handleConfirm() {
    const valid = rows.filter((r) => r._match);
    if (valid.length === 0) { setError("No valid rows to import."); return; }
    startTransition(async () => {
      const result = await confirmImport(rows, fileName);
      if (result.error) setError(result.error);
      else { setImportResult(`Successfully imported ${valid.length} of ${rows.length} records.`); setRows([]); }
    });
  }

  const validCount = rows.filter((r) => r._match).length;
  const failCount = rows.length - validCount;

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Select CSV File</CardTitle></CardHeader>
        <CardContent>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
          <p className="mt-2 text-xs text-muted-foreground">Expected format: semicolon-delimited CSV with columns: {CSV_COLUMNS.join(", ")}</p>
        </CardContent>
      </Card>

      {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {importResult && <div className="rounded-lg border border-green-500/50 bg-green-50 p-4 text-sm text-green-700">{importResult}</div>}

      {rows.length > 0 && (<>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total: <strong>{rows.length}</strong> rows | Match: <strong className="text-green-600">{validCount}</strong> | Failed: <strong className="text-destructive">{failCount}</strong></p>
          <Button onClick={handleConfirm} disabled={isPending || validCount === 0}>{isPending ? "Importing..." : "Confirm Import"}</Button>
        </div>
        <div className="rounded-lg border"><Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">NIP</TableHead>
            <TableHead className="text-xs">Name (CSV)</TableHead><TableHead className="text-xs">Match</TableHead>
            <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Remarks</TableHead>
            <TableHead className="text-xs text-right">Late</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx} className={`text-xs ${!row._match ? "bg-destructive/5" : row._dup ? "bg-yellow-50" : ""}`}>
                <TableCell className="whitespace-nowrap">{row.attendance_date}</TableCell>
                <TableCell className="font-mono">{row.employee_code}</TableCell>
                <TableCell>{row.employee_name}</TableCell>
                <TableCell>{row._match ? <span className="text-green-600 font-medium">{row._matched_name}</span> : row._dup ? <Badge variant="warning">Duplicate</Badge> : <Badge variant="danger">No match</Badge>}</TableCell>
                <TableCell><Badge variant={statusBadgeVariant(row._status)}>{STATUS_LABEL[row._status] ?? row._status}</Badge></TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">{row._remarks}</TableCell>
                <TableCell className="text-right">{row._late > 0 ? <span className="inline-block rounded bg-yellow-100 px-1.5 py-0.5 font-medium text-yellow-800">{row._late}m</span> : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </>)}
    </div>
  );
}
