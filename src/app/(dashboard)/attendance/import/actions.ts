"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function normalizeTime(val: string): string | null {
  if (!val || val.trim() === "" || val.trim() === "00:00:00") return null;
  return val.trim();
}

function parseYesNo(val: string): boolean {
  const v = val?.trim().toLowerCase() ?? "";
  return (
    v === "y" || v === "yes" || v === "1" || v === "ya" ||
    v === "true" || v === "v" || v === "ok" || v === "✓" || v === "✔"
  );
}

function parseNum(val: string): number {
  const n = parseInt(val?.trim(), 10);
  return isNaN(n) ? 0 : n;
}

function timeToMinutes(t: string | null): number {
  if (!t) return -1;
  const parts = t.split(":");
  if (parts.length < 2) return -1;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
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
  const d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  return d.getDay() === 0;
}

function isTidakHadirSchedule(scheduleName: string | null): boolean {
  if (!scheduleName) return false;
  const lower = scheduleName.toLowerCase().trim();
  return lower === "tidak hadir" || lower.includes("tidak hadir");
}

function determineStatusAndRemarks(row: {
  attendance_date: string;
  shift_name: string | null;
  schedule_name: string | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
  is_public_holiday: boolean;
  is_routine_day_off: boolean;
}): { status: string; remarks: string } {
  const actualIn = normalizeTime(row.actual_check_in ?? "");
  const actualOut = normalizeTime(row.actual_check_out ?? "");
  const shiftIsDayOff = isDayOffShift(row.shift_name);
  const isHoliday = row.is_public_holiday;
  const isRoutineDayOff = row.is_routine_day_off;
  const isAnyDayOff = isHoliday || isRoutineDayOff || shiftIsDayOff;

  // (a1) Explicit public holiday flag — no scans
  if (isHoliday && !actualIn && !actualOut) {
    return { status: "libur_umum", remarks: "Libur Umum" };
  }

  // (a2) Routine day off or shift text day off — no scans
  if ((isRoutineDayOff || shiftIsDayOff) && !actualIn && !actualOut) {
    return { status: "libur_rutin", remarks: "Libur" };
  }

  // (b) Any day off BUT scanned in
  if (isAnyDayOff && actualIn) {
    if (isSunday(row.attendance_date)) {
      return { status: "hadir_lembur", remarks: "Hadir (lembur)" };
    }
    return { status: "hadir", remarks: "-" };
  }

  // (c) Schedule explicitly says "Tidak Hadir"
  if (isTidakHadirSchedule(row.schedule_name)) {
    return { status: "tidak_hadir", remarks: "Tidak Hadir" };
  }

  // (d) Normal shift, no check-in
  if (!actualIn) {
    return { status: "tidak_hadir", remarks: "Tidak scan masuk" };
  }

  // (e) Normal shift, check-in but no check-out
  if (actualIn && !actualOut) {
    return { status: "tidak_hadir", remarks: "Tidak scan pulang" };
  }

  // (f) Normal shift, both scans present
  return { status: "hadir", remarks: "-" };
}

function calcLateMinutes(scheduled: string | null, actual: string | null): number {
  const s = normalizeTime(scheduled ?? "");
  const a = normalizeTime(actual ?? "");
  if (!s || !a) return 0;
  const diff = timeToMinutes(a) - timeToMinutes(s);
  return Math.max(0, diff);
}

function calcEarlyLeaveMinutes(scheduled: string | null, actual: string | null): number {
  const s = normalizeTime(scheduled ?? "");
  const a = normalizeTime(actual ?? "");
  if (!s || !a) return 0;
  const diff = timeToMinutes(s) - timeToMinutes(a);
  return Math.max(0, diff);
}

export async function confirmImport(
  rows: any[],
  fileName: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("email", user.email)
    .single();
  if (!employee) return { error: "Employee record not found" };

  const validRows = rows.filter((r: any) => r._match);
  if (validRows.length === 0) return { error: "No valid rows to import" };

  const dates = validRows.map((r: any) => r.attendance_date).sort();
  const periodStart = dates[0];
  const periodEnd = dates[dates.length - 1];

  const { data: importRecord, error: importError } = await supabase
    .from("attendance_imports")
    .insert({
      file_name: fileName,
      period_start: periodStart,
      period_end: periodEnd,
      total_rows: rows.length,
      uploaded_by: employee.id,
      status: validRows.length === rows.length ? "success" : "partial",
    })
    .select()
    .single();

  if (importError) return { error: `Failed to create import record: ${importError.message}` };

  const attendanceRecords = validRows.map((r: any) => {
    const { status, remarks } = determineStatusAndRemarks({
      attendance_date: r.attendance_date,
      shift_name: r.shift_name,
      schedule_name: r.schedule_name,
      actual_check_in: r.actual_check_in,
      actual_check_out: r.actual_check_out,
      is_public_holiday: r.is_public_holiday,
      is_routine_day_off: r.is_routine_day_off,
    });

    const scheduledIn = normalizeTime(r.scheduled_check_in ?? "");
    const actualIn = normalizeTime(r.actual_check_in ?? "");
    const scheduledOut = normalizeTime(r.scheduled_check_out ?? "");
    const actualOut = normalizeTime(r.actual_check_out ?? "");

    return {
      employee_id: r._employee_id,
      attendance_date: r.attendance_date,
      schedule_name: r.schedule_name || null,
      shift_name: r.shift_name || null,
      status,
      is_valid: r.is_valid,
      is_public_holiday: r.is_public_holiday,
      is_routine_day_off: r.is_routine_day_off,
      office_location: r.office_location || "",
      scheduled_check_in: scheduledIn,
      actual_check_in: actualIn,
      check_in_device_sn: r.check_in_device_sn || null,
      late_permission: parseYesNo(r.late_permission),
      late_minutes: calcLateMinutes(scheduledIn, actualIn),
      break_check_1: normalizeTime(r.break_check_1 ?? ""),
      break_check_2: normalizeTime(r.break_check_2 ?? ""),
      break_minutes: parseNum(r.break_minutes),
      overtime_break_minutes: parseNum(r.overtime_break_minutes),
      early_leave_permission: parseYesNo(r.early_leave_permission),
      early_leave_minutes: calcEarlyLeaveMinutes(scheduledOut, actualOut),
      scheduled_check_out: scheduledOut,
      actual_check_out: actualOut,
      check_out_device_sn: r.check_out_device_sn || null,
      duration_minutes: parseNum(r.duration_minutes),
      is_counted: parseYesNo(r.is_counted),
      overtime_minutes: parseNum(r.overtime_minutes),
      remarks,
      import_batch_id: importRecord.id,
    };
  });

  const { error: insertError } = await supabase
    .from("attendance")
    .upsert(attendanceRecords, {
      onConflict: "employee_id,attendance_date",
      ignoreDuplicates: false,
    });

  if (insertError) {
    return { error: `Failed to insert attendance: ${insertError.message}` };
  }

  revalidatePath("/attendance");
  return { success: true };
}
