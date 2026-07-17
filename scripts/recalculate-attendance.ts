/**
 * Recalculate status & remarks for ALL existing attendance records
 * using the current logic from attendance-logic.ts
 *
 * Usage: npx tsx scripts/recalculate-attendance.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import {
  determineStatusAndRemarks,
  calcLateMinutes,
  calcEarlyLeaveMinutes,
} from "../src/lib/attendance-logic";

function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) { console.error(".env.local not found"); process.exit(1); }
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key && value) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Missing env vars"); process.exit(1); }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Fetch all attendance
  const { data: all, error } = await supabase
    .from("attendance")
    .select("id, attendance_date, shift_name, schedule_name, actual_check_in, actual_check_out, is_public_holiday, is_routine_day_off, scheduled_check_in, scheduled_check_out, status, late_minutes, early_leave_minutes, remarks")
    .order("attendance_date");

  if (error) { console.error("Query failed:", error.message); process.exit(1); }
  console.log(`Found ${all.length} attendance records`);

  let changed = 0;
  let holidayFix = 0;
  let symmetryFix = 0;
  const updates: any[] = [];

  for (const row of all) {
    const { status: newStatus, remarks: newRemarks } = determineStatusAndRemarks({
      attendance_date: row.attendance_date,
      shift_name: row.shift_name,
      schedule_name: row.schedule_name,
      actual_check_in: row.actual_check_in,
      actual_check_out: row.actual_check_out,
      is_public_holiday: !!row.is_public_holiday,
      is_routine_day_off: !!row.is_routine_day_off,
    });

    const newLate = calcLateMinutes(row.scheduled_check_in, row.actual_check_in);
    const newEarly = calcEarlyLeaveMinutes(row.scheduled_check_out, row.actual_check_out);

    if (newStatus !== row.status || newRemarks !== row.remarks || newLate !== row.late_minutes || newEarly !== row.early_leave_minutes) {
      changed++;
      if (newStatus === "libur_umum" && row.status === "tidak_hadir") holidayFix++;
      if (newStatus === "hadir" && row.status === "tidak_hadir" && (row.actual_check_in || row.actual_check_out)) symmetryFix++;

      updates.push({ id: row.id, status: newStatus, remarks: newRemarks, late_minutes: newLate, early_leave_minutes: newEarly });
    }
  }

  console.log(`Records needing update: ${updates.length}`);
  console.log(`  Holiday fix (tidak_hadir → libur_umum): ${holidayFix}`);
  console.log(`  Symmetry fix (tidak_hadir → hadir): ${symmetryFix}`);

  if (updates.length === 0) { console.log("No updates needed."); return; }

    // Batch update (50 per batch)
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      for (const u of batch) {
        await supabase.from("attendance").update({
          status: u.status, remarks: u.remarks,
          late_minutes: u.late_minutes, early_leave_minutes: u.early_leave_minutes,
        }).eq("id", u.id);
      }
      process.stdout.write(`  Updated ${Math.min(i + 50, updates.length)} / ${updates.length}\r`);
    }

  console.log(`\nDone. ${updates.length} records updated.`);
}

main().catch(console.error);
