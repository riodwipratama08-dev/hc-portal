"use server";

import { createClient } from "@/lib/supabase/server";

interface Filter { startDate: string; endDate: string; departmentId?: string; employeeId?: string }

async function getEmployee() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: emp } = await supabase.from("employees").select("id, role, department_id").eq("email", user.email).single();
  return emp;
}

function buildEmployeeIds(emp: any, deptId?: string): string[] | null {
  if (!emp) return null;
  if (emp.role === "employee") return null; // no access
  if (emp.role === "admin" || emp.role === "hr" || emp.role === "executive") return null; // all
  if (deptId) return null; // admin/hr with filter
  // manager: only own department
  return null; // handled by query
}

export async function getAttendanceSummary(f: Filter) {
  const emp = await getEmployee();
  if (!emp || emp.role === "employee") return [];

  const supabase = createClient();
  let q = supabase.from("attendance")
    .select("employee_id, status, late_minutes, early_leave_minutes, employees(id, full_name, employee_code, department_id, departments(name))")
    .gte("attendance_date", f.startDate).lte("attendance_date", f.endDate);

  if (emp.role === "manager") q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", emp.department_id)).data?.map((e: any) => e.id) ?? []);
  else if (f.departmentId) q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", f.departmentId)).data?.map((e: any) => e.id) ?? []);
  if (f.employeeId) q = q.eq("employee_id", f.employeeId);

  const { data: rows } = await q as any;
  const summary: Record<string, any> = {};
  for (const r of rows ?? []) {
    const eid = r.employee_id;
    if (!summary[eid]) {
      summary[eid] = { emp: r.employees, hadir: 0, tidakHadir: 0, izin: 0, cuti: 0, libur: 0, terlambat: 0, terlambatMenit: 0, pulangAwal: 0, pulangAwalMenit: 0, total: 0 };
    }
    const s = summary[eid]; s.total++;
    if (r.status === "hadir" || r.status === "hadir_lembur") s.hadir++;
    else if (r.status === "tidak_hadir") s.tidakHadir++;
    else if (r.status === "izin") s.izin++;
    else if (r.status === "cuti") s.cuti++;
    else if (r.status === "libur_umum" || r.status === "libur_rutin") s.libur++;
    if (r.late_minutes > 0) { s.terlambat++; s.terlambatMenit += r.late_minutes; }
    if (r.early_leave_minutes > 0) { s.pulangAwal++; s.pulangAwalMenit += r.early_leave_minutes; }
  }
  return Object.values(summary);
}

export async function getLateRanking(f: Filter) {
  const emp = await getEmployee();
  if (!emp || emp.role === "employee") return [];

  const supabase = createClient();
  let q = supabase.from("attendance")
    .select("employee_id, late_minutes, employees(id, full_name, employee_code, department_id, departments(name))")
    .gte("attendance_date", f.startDate).lte("attendance_date", f.endDate).gt("late_minutes", 0);

  if (emp.role === "manager") q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", emp.department_id)).data?.map((e: any) => e.id) ?? []);
  else if (f.departmentId) q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", f.departmentId)).data?.map((e: any) => e.id) ?? []);

  const { data: rows } = await q as any;
  const agg: Record<string, any> = {};
  for (const r of rows ?? []) {
    if (!agg[r.employee_id]) agg[r.employee_id] = { emp: r.employees, count: 0, totalMinutes: 0 };
    agg[r.employee_id].count++;
    agg[r.employee_id].totalMinutes += r.late_minutes;
  }
  return Object.values(agg).sort((a: any, b: any) => b.totalMinutes - a.totalMinutes);
}

export async function getLeaveReport(f: Filter) {
  const emp = await getEmployee();
  if (!emp || emp.role === "employee") return [];

  const supabase = createClient();
  let q = supabase.from("leave_requests")
    .select("employee_id, reason_id, custom_reason_label, status, start_date, end_date, leave_reasons(label, leave_categories(name, affects_payroll_or_attendance)), employees(id, full_name, employee_code, department_id)")
    .gte("start_date", f.startDate).lte("start_date", f.endDate);

  if (emp.role === "manager") q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", emp.department_id)).data?.map((e: any) => e.id) ?? []);
  else if (f.departmentId) q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", f.departmentId)).data?.map((e: any) => e.id) ?? []);

  const { data: rows } = await q as any;
  const perCat: Record<string, any> = {};
  for (const r of rows ?? []) {
    const catName = r.leave_reasons?.leave_categories?.name || "Other";
    if (!perCat[catName]) perCat[catName] = { category: catName, approved: 0, rejected: 0, pending: 0, total: 0 };
    perCat[catName].total++;
    if (r.status === "approved") perCat[catName].approved++;
    else if (r.status === "rejected") perCat[catName].rejected++;
    else if (r.status === "pending") perCat[catName].pending++;
  }
  return Object.values(perCat);
}

export async function getOvertimeReport(f: Filter) {
  const emp = await getEmployee();
  if (!emp || emp.role === "employee") return [];

  const supabase = createClient();
  let q = supabase.from("overtime_records")
    .select("employee_id, overtime_minutes, status, created_at, employees(id, full_name, employee_code, department_id, departments(name))")
    .gte("created_at", f.startDate + "T00:00:00").lte("created_at", f.endDate + "T23:59:59");

  if (emp.role === "manager") q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", emp.department_id)).data?.map((e: any) => e.id) ?? []);
  else if (f.departmentId) q = q.in("employee_id",
    (await supabase.from("employees").select("id").eq("department_id", f.departmentId)).data?.map((e: any) => e.id) ?? []);

  const { data: rows } = await q as any;
  const agg: Record<string, any> = {};
  for (const r of rows ?? []) {
    if (!agg[r.employee_id]) agg[r.employee_id] = { emp: r.employees, totalMinutes: 0, count: 0 };
    agg[r.employee_id].totalMinutes += r.overtime_minutes;
    agg[r.employee_id].count++;
  }
  return Object.values(agg);
}
