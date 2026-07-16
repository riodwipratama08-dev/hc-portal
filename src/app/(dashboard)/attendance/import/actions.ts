"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeTime, parseYesNo, determineStatusAndRemarks,
  calcLateMinutes, calcEarlyLeaveMinutes,
} from "@/lib/attendance-logic";

function parseNum(val: string): number {
  const n = parseInt(val?.trim(), 10);
  return isNaN(n) ? 0 : n;
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
