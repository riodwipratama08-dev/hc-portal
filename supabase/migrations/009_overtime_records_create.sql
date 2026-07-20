-- =============================================
-- FIX: Properly create overtime_records table
-- =============================================

CREATE TABLE IF NOT EXISTS overtime_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  overtime_minutes INT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overtime_records_attendance_id ON overtime_records (attendance_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_employee_id ON overtime_records (employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_status ON overtime_records (status);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
