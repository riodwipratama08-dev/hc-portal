export function normalizeNip(nip: string): string {
  return nip.replace(/^0+/, "");
}

export function normalizeTime(val: string): string | null {
  if (!val || val.trim() === "" || val.trim() === "00:00:00") return null;
  return val.trim();
}

export function parseYesNo(val: string): boolean {
  const v = val?.trim().toLowerCase() ?? "";
  return (
    v === "y" || v === "yes" || v === "1" || v === "ya" ||
    v === "true" || v === "v" || v === "ok" || v === "✓" || v === "✔"
  );
}

function isLikelyTimeRange(text: string): boolean {
  return /^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}$/.test(text.trim());
}

export function isDayOffShift(shiftName: string | null): boolean {
  if (!shiftName) return false;
  const lower = shiftName.toLowerCase().trim();
  const keywords = [
    "libur", "hari raya", "tgl merah", "off", "holiday",
    "idul fitri", "idul adha", "tahun baru", "maulid", "isra", "waisak",
    "nyepi", "kenaikan", "isa almasih", "kemerdekaan", "natal", "imlek",
    "paskah", "kurban", "hijriah", "cuti bersama", "proklamasi",
    "wali", "lahir pancasila", "hari buruh", "hari pahlawan",
    "hari guru", "hari kartini", "hari santri",
  ];
  return keywords.some((k) => lower.includes(k));
}

export function isSunday(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return false;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.getDay() === 0;
}

export function isTidakHadirSchedule(scheduleName: string | null): boolean {
  if (!scheduleName) return false;
  const lower = scheduleName.toLowerCase().trim();
  return lower === "tidak hadir" || lower.includes("tidak hadir");
}

export interface StatusInput {
  attendance_date: string;
  shift_name: string | null;
  schedule_name: string | null;
  actual_check_in: string | null;
  actual_check_out: string | null;
  is_public_holiday: boolean;
  is_routine_day_off: boolean;
}

export function determineStatusAndRemarks(row: StatusInput): { status: string; remarks: string } {
  const actualIn = normalizeTime(row.actual_check_in ?? "");
  const actualOut = normalizeTime(row.actual_check_out ?? "");
  const shiftName = row.shift_name;
  const shiftIsDayOff = isDayOffShift(shiftName);
  const isHoliday = row.is_public_holiday;
  const isRoutineDayOff = row.is_routine_day_off;
  const isAnyDayOff = isHoliday || isRoutineDayOff || shiftIsDayOff;

  // (1) Public holiday flag from CSV — no scans
  if (isHoliday && !actualIn && !actualOut) {
    return { status: "libur_umum", remarks: shiftName || "Libur Umum" };
  }

  // (2) Routine day off flag — no scans
  if (isRoutineDayOff && !actualIn && !actualOut) {
    return { status: "libur_rutin", remarks: "Libur" };
  }

  // (3) CATCH-ALL: shift_name is NOT a time range AND no scans AND not "Libur Rutin"
  //     → treat as national holiday (catches names like "Hari Buruh Internasional")
  if (shiftName && !isLikelyTimeRange(shiftName) && shiftName.trim().toLowerCase() !== "libur rutin" && !actualIn && !actualOut) {
    return { status: "libur_umum", remarks: shiftName };
  }

  // (4) shift text says day off (keyword match) — no scans
  if (shiftIsDayOff && !actualIn && !actualOut) {
    return { status: "libur_rutin", remarks: "Libur" };
  }

  // (5) Any day off BUT scanned in
  if (isAnyDayOff && actualIn) {
    if (isSunday(row.attendance_date)) {
      return { status: "hadir_lembur", remarks: "Hadir (lembur)" };
    }
    return { status: "hadir", remarks: "-" };
  }

  // (6) Schedule explicitly says "Tidak Hadir"
  if (isTidakHadirSchedule(row.schedule_name)) {
    return { status: "tidak_hadir", remarks: "Tidak Hadir" };
  }

  // (6) Normal shift — symmetrical hadir/tidak_hadir logic
  if (!actualIn && !actualOut) {
    return { status: "tidak_hadir", remarks: "Tidak Hadir" };
  }

  if (actualIn && !actualOut) {
    return { status: "hadir", remarks: "Tidak scan pulang" };
  }

  if (!actualIn && actualOut) {
    return { status: "hadir", remarks: "Tidak scan masuk" };
  }

  // Both scans present
  return { status: "hadir", remarks: "-" };
}

export function calcLateMinutes(scheduled: string | null, actual: string | null): number {
  const s = normalizeTime(scheduled ?? "");
  const a = normalizeTime(actual ?? "");
  if (!s || !a) return 0;
  const [sh, sm] = s.split(":").map(Number);
  const [ah, am] = a.split(":").map(Number);
  return Math.max(0, (ah * 60 + am) - (sh * 60 + sm));
}

export function calcEarlyLeaveMinutes(scheduled: string | null, actual: string | null): number {
  const s = normalizeTime(scheduled ?? "");
  const a = normalizeTime(actual ?? "");
  if (!s || !a) return 0;
  const [sh, sm] = s.split(":").map(Number);
  const [ah, am] = a.split(":").map(Number);
  return Math.max(0, (sh * 60 + sm) - (ah * 60 + am));
}
