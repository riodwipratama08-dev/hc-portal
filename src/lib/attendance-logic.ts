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

export function isDayOffShift(shiftName: string | null): boolean {
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
  const shiftIsDayOff = isDayOffShift(row.shift_name);
  const isHoliday = row.is_public_holiday;
  const isRoutineDayOff = row.is_routine_day_off;
  const isAnyDayOff = isHoliday || isRoutineDayOff || shiftIsDayOff;

  if (isHoliday && !actualIn && !actualOut) {
    return { status: "libur_umum", remarks: "Libur Umum" };
  }

  if ((isRoutineDayOff || shiftIsDayOff) && !actualIn && !actualOut) {
    return { status: "libur_rutin", remarks: "Libur" };
  }

  if (isAnyDayOff && actualIn) {
    if (isSunday(row.attendance_date)) {
      return { status: "hadir_lembur", remarks: "Hadir (lembur)" };
    }
    return { status: "hadir", remarks: "-" };
  }

  if (isTidakHadirSchedule(row.schedule_name)) {
    return { status: "tidak_hadir", remarks: "Tidak Hadir" };
  }

  if (!actualIn) {
    return { status: "tidak_hadir", remarks: "Tidak scan masuk" };
  }

  if (actualIn && !actualOut) {
    return { status: "tidak_hadir", remarks: "Tidak scan pulang" };
  }

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
