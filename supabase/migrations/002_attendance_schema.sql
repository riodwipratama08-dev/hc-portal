-- 4.4 shifts (definisi jam kerja)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  applicable_days JSONB NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.5 schedules (grup jadwal induk)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.6 schedule_shifts (relasi schedule â†” shift)
CREATE TABLE schedule_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  UNIQUE(schedule_id, shift_id)
);

-- 4.7 employee_schedules (histori jadwal per karyawan)
CREATE TABLE employee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE RESTRICT,
  effective_start DATE NOT NULL,
  effective_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.9 attendance_imports (dibuat dulu karena attendance punya FK ke sini)
CREATE TABLE attendance_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'partial', 'failed'))
);

-- 4.8 attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  attendance_date DATE NOT NULL,
  schedule_name TEXT,
  shift_name TEXT,
  status TEXT NOT NULL DEFAULT 'hadir' CHECK (status IN ('hadir','tidak_hadir','libur_umum','libur_rutin','cuti','izin')),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  is_public_holiday BOOLEAN NOT NULL DEFAULT false,
  is_routine_day_off BOOLEAN NOT NULL DEFAULT false,
  office_location TEXT NOT NULL DEFAULT '',
  scheduled_check_in TIME,
  actual_check_in TIME,
  check_in_device_sn TEXT,
  late_permission BOOLEAN NOT NULL DEFAULT false,
  late_minutes INT NOT NULL DEFAULT 0,
  break_check_1 TIME,
  break_check_2 TIME,
  break_minutes INT NOT NULL DEFAULT 0,
  overtime_break_minutes INT NOT NULL DEFAULT 0,
  early_leave_permission BOOLEAN NOT NULL DEFAULT false,
  early_leave_minutes INT NOT NULL DEFAULT 0,
  scheduled_check_out TIME,
  actual_check_out TIME,
  check_out_device_sn TEXT,
  duration_minutes INT NOT NULL DEFAULT 0,
  is_counted BOOLEAN NOT NULL DEFAULT true,
  overtime_minutes INT NOT NULL DEFAULT 0,
  remarks TEXT,
  import_batch_id UUID REFERENCES attendance_imports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

CREATE INDEX idx_attendance_employee_date ON attendance (employee_id, attendance_date);
CREATE INDEX idx_attendance_import_batch ON attendance (import_batch_id);
CREATE INDEX idx_attendance_status ON attendance (status);
CREATE INDEX idx_employee_schedules_employee ON employee_schedules (employee_id);
CREATE INDEX idx_schedule_shifts_schedule ON schedule_shifts (schedule_id);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
