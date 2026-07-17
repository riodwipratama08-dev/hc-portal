import { describe, it, expect } from "vitest";
import {
  determineStatusAndRemarks,
  calcLateMinutes,
  calcEarlyLeaveMinutes,
  isDayOffShift,
  isSunday,
  normalizeNip,
  type StatusInput,
} from "@/lib/attendance-logic";

function makeRow(overrides: Partial<StatusInput> = {}): StatusInput {
  return {
    attendance_date: "2026-07-15",
    shift_name: null,
    schedule_name: null,
    actual_check_in: null,
    actual_check_out: null,
    is_public_holiday: false,
    is_routine_day_off: false,
    ...overrides,
  };
}

describe("determineStatusAndRemarks", () => {
  // === Holiday detection ===
  it("shift rutin libur + no scan → libur_rutin", () => {
    const r = determineStatusAndRemarks(makeRow({ shift_name: "Libur Rutin" }));
    expect(r.status).toBe("libur_rutin");
    expect(r.remarks).toBe("Libur");
  });

  it("national holiday + no scan → libur_umum", () => {
    const r = determineStatusAndRemarks(makeRow({ is_public_holiday: true }));
    expect(r.status).toBe("libur_umum");
    expect(r.remarks).toBe("Libur Umum");
  });

  it("Hari Buruh Internasional → libur_umum (catch-all by non-time-range)", () => {
    const r = determineStatusAndRemarks(makeRow({
      shift_name: "Hari Buruh Internasional",
      attendance_date: "2026-05-01",
    }));
    expect(r.status).toBe("libur_umum");
    expect(r.remarks).toContain("Hari Buruh");
  });

  it("unknown holiday name that is not a time range → libur_umum (catch-all)", () => {
    const r = determineStatusAndRemarks(makeRow({
      shift_name: "Hari Raya Nyepi",
    }));
    expect(r.status).toBe("libur_umum");
    expect(r.remarks).toContain("Hari Raya Nyepi");
  });

  // === Lembur detection ===
  it("Sunday + scan masuk → hadir_lembur", () => {
    const r = determineStatusAndRemarks(makeRow({
      attendance_date: "2026-07-19",
      is_routine_day_off: true,
      actual_check_in: "08:00:00",
    }));
    expect(r.status).toBe("hadir_lembur");
    expect(r.remarks).toBe("Hadir (lembur)");
  });

  it("non-Sunday day off + scan masuk → hadir (bukan lembur)", () => {
    const r = determineStatusAndRemarks(makeRow({
      attendance_date: "2026-07-14",
      shift_name: "Libur Rutin",
      actual_check_in: "08:00:00",
    }));
    expect(r.status).toBe("hadir");
    expect(r.remarks).toBe("-");
  });

  // === Normal shift — symmetrical logic ===
  it("both scans present → hadir", () => {
    const r = determineStatusAndRemarks(makeRow({
      shift_name: "07:00-16:00",
      actual_check_in: "07:05:00",
      actual_check_out: "16:00:00",
    }));
    expect(r.status).toBe("hadir");
    expect(r.remarks).toBe("-");
  });

  it("only check-in → hadir + 'Tidak scan pulang'", () => {
    const r = determineStatusAndRemarks(makeRow({
      shift_name: "07:00-16:00",
      actual_check_in: "07:05:00",
    }));
    expect(r.status).toBe("hadir");
    expect(r.remarks).toBe("Tidak scan pulang");
  });

  it("only check-out → hadir + 'Tidak scan masuk' (symmetrical)", () => {
    const r = determineStatusAndRemarks(makeRow({
      shift_name: "07:00-16:00",
      actual_check_out: "16:00:00",
    }));
    expect(r.status).toBe("hadir");
    expect(r.remarks).toBe("Tidak scan masuk");
  });

  it("no scans at all → tidak_hadir + 'Tidak Hadir'", () => {
    const r = determineStatusAndRemarks(makeRow({
      shift_name: "07:00-16:00",
    }));
    expect(r.status).toBe("tidak_hadir");
    expect(r.remarks).toBe("Tidak Hadir");
  });

  // === Schedule = "Tidak Hadir" ===
  it("schedule 'Tidak Hadir' → tidak_hadir", () => {
    const r = determineStatusAndRemarks(makeRow({ schedule_name: "Tidak Hadir" }));
    expect(r.status).toBe("tidak_hadir");
    expect(r.remarks).toBe("Tidak Hadir");
  });
});

describe("calcLateMinutes", () => {
  it("returns 0 when scheduled == actual", () => { expect(calcLateMinutes("07:00", "07:00")).toBe(0); });
  it("returns positive when actual > scheduled", () => { expect(calcLateMinutes("07:00", "07:15")).toBe(15); });
  it("returns 0 when actual < scheduled (early)", () => { expect(calcLateMinutes("07:00", "06:50")).toBe(0); });
  it("returns 0 when either is null/empty/00:00:00", () => {
    expect(calcLateMinutes(null, "07:00")).toBe(0);
    expect(calcLateMinutes("07:00", "00:00:00")).toBe(0);
  });
});

describe("calcEarlyLeaveMinutes", () => {
  it("returns 0 when scheduled == actual", () => { expect(calcEarlyLeaveMinutes("16:00", "16:00")).toBe(0); });
  it("returns positive when actual < scheduled", () => { expect(calcEarlyLeaveMinutes("16:00", "15:30")).toBe(30); });
  it("returns 0 when actual > scheduled (overtime)", () => { expect(calcEarlyLeaveMinutes("16:00", "17:00")).toBe(0); });
  it("returns 0 when either is null", () => { expect(calcEarlyLeaveMinutes(null, "15:00")).toBe(0); });
});

describe("isDayOffShift", () => {
  it("detects 'Libur' keyword", () => { expect(isDayOffShift("Libur Rutin")).toBe(true); });
  it("detects 'Idul Fitri'", () => { expect(isDayOffShift("Idul Fitri 1446 H")).toBe(true); });
  it("detects 'hari raya' in text", () => { expect(isDayOffShift("Hari Raya Nyepi")).toBe(true); });
  it("detects 'Hari Buruh'", () => { expect(isDayOffShift("Hari Buruh Internasional")).toBe(true); });
  it("does NOT detect time ranges as day off", () => { expect(isDayOffShift("07:00-16:00")).toBe(false); });
  it("returns false for null", () => { expect(isDayOffShift(null)).toBe(false); });
});

describe("isSunday", () => {
  it("2026-07-19 is Sunday", () => { expect(isSunday("2026-07-19")).toBe(true); });
  it("2026-07-20 is Monday", () => { expect(isSunday("2026-07-20")).toBe(false); });
  it("2026-07-18 is Saturday", () => { expect(isSunday("2026-07-18")).toBe(false); });
});

describe("normalizeNip", () => {
  it("strips leading zeros", () => { expect(normalizeNip("0425146")).toBe("425146"); });
  it("leaves unchanged when no leading zeros", () => { expect(normalizeNip("425146")).toBe("425146"); });
  it("strips multiple leading zeros", () => { expect(normalizeNip("000425146")).toBe("425146"); });
  it("zero-only NIP becomes empty", () => { expect(normalizeNip("0")).toBe(""); });
  it("empty string stays empty", () => { expect(normalizeNip("")).toBe(""); });
  it("0225138 becomes 225138", () => { expect(normalizeNip("0225138")).toBe("225138"); });
  it("225138 stays 225138", () => { expect(normalizeNip("225138")).toBe("225138"); });
});
