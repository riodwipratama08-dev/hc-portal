export interface Department {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  title: string;
  department_id: string;
  level: number;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  nickname: string | null;
  email: string;
  phone: string;
  address: string | null;
  department_id: string;
  position_id: string;
  join_date: string;
  status: "active" | "resigned" | "terminated";
  role: "admin" | "hr" | "manager" | "employee";
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  applicable_days: string[];
  is_active: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ScheduleShift {
  id: string;
  schedule_id: string;
  shift_id: string;
}

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  schedule_id: string;
  effective_start: string;
  effective_end: string | null;
  created_at: string;
}

export interface AttendanceImport {
  id: string;
  file_name: string;
  period_start: string;
  period_end: string;
  total_rows: number;
  uploaded_by: string;
  uploaded_at: string;
  status: "pending" | "processing" | "success" | "partial" | "failed";
}

export interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  schedule_name: string | null;
  shift_name: string | null;
  status: "hadir" | "tidak_hadir" | "libur_umum" | "libur_rutin" | "cuti" | "izin";
  is_valid: boolean;
  is_public_holiday: boolean;
  is_routine_day_off: boolean;
  office_location: string;
  scheduled_check_in: string | null;
  actual_check_in: string | null;
  check_in_device_sn: string | null;
  late_permission: boolean;
  late_minutes: number;
  break_check_1: string | null;
  break_check_2: string | null;
  break_minutes: number;
  overtime_break_minutes: number;
  early_leave_permission: boolean;
  early_leave_minutes: number;
  scheduled_check_out: string | null;
  actual_check_out: string | null;
  check_out_device_sn: string | null;
  duration_minutes: number;
  is_counted: boolean;
  overtime_minutes: number;
  remarks: string | null;
  import_batch_id: string | null;
  created_at: string;
}

export type EmployeeWithRelations = Employee & {
  departments: Department;
  positions: Position;
};

export type AttendanceWithEmployee = Attendance & {
  employees: Pick<Employee, "id" | "full_name" | "employee_code">;
};

export interface OvertimeRecord {
  id: string;
  attendance_id: string;
  employee_id: string;
  recorded_by: string;
  overtime_minutes: number;
  notes: string | null;
  status: "recorded" | "approved";
  created_at: string;
}

export interface LeaveCategory {
  id: string;
  name: string;
  affects_payroll_or_attendance: boolean;
  is_active: boolean;
  created_at: string;
}

export interface LeaveReason {
  id: string;
  category_id: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  reason_id: string | null;
  custom_reason_label: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  additional_notes: string | null;
  attachment_url: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  leave_request_id: string;
  approver_id: string;
  level: number;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  acted_at: string | null;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_category_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  updated_at: string;
}
