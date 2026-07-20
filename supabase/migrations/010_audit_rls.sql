-- 4.15 audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- RLS Helper functions
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  BEGIN RETURN (SELECT role FROM employees WHERE email = auth.jwt() ->> 'email' LIMIT 1); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_dept_id() RETURNS UUID AS $$
  BEGIN RETURN (SELECT department_id FROM employees WHERE email = auth.jwt() ->> 'email' LIMIT 1); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_emp_id() RETURNS UUID AS $$
  BEGIN RETURN (SELECT id FROM employees WHERE email = auth.jwt() ->> 'email' LIMIT 1); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employees_select ON employees;
CREATE POLICY employees_select ON employees FOR SELECT USING (
  get_user_role() IN ('admin','hr','executive')
  OR (get_user_role() = 'manager' AND department_id = get_user_dept_id())
  OR id = get_user_emp_id()
);
DROP POLICY IF EXISTS employees_insert ON employees;
CREATE POLICY employees_insert ON employees FOR INSERT WITH CHECK (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS employees_update ON employees;
CREATE POLICY employees_update ON employees FOR UPDATE USING (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS employees_delete ON employees;
CREATE POLICY employees_delete ON employees FOR DELETE USING (get_user_role() = 'admin');

-- attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS attendance_select ON attendance;
CREATE POLICY attendance_select ON attendance FOR SELECT USING (
  get_user_role() IN ('admin','hr','executive')
  OR employee_id IN (SELECT id FROM employees WHERE department_id = get_user_dept_id())
  OR employee_id = get_user_emp_id()
);

-- leave_requests
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leave_requests_select ON leave_requests;
CREATE POLICY leave_requests_select ON leave_requests FOR SELECT USING (
  get_user_role() IN ('admin','hr','executive')
  OR employee_id IN (SELECT id FROM employees WHERE department_id = get_user_dept_id())
  OR employee_id = get_user_emp_id()
);

-- approvals
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS approvals_select ON approvals;
CREATE POLICY approvals_select ON approvals FOR SELECT USING (
  get_user_role() IN ('admin','hr','executive')
  OR approver_id = get_user_emp_id()
);

-- leave_balances
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leave_balances_select ON leave_balances;
CREATE POLICY leave_balances_select ON leave_balances FOR SELECT USING (
  get_user_role() IN ('admin','hr','executive')
  OR employee_id IN (SELECT id FROM employees WHERE department_id = get_user_dept_id())
  OR employee_id = get_user_emp_id()
);

-- overtime_records
ALTER TABLE overtime_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS overtime_records_select ON overtime_records;
CREATE POLICY overtime_records_select ON overtime_records FOR SELECT USING (
  get_user_role() IN ('admin','hr','executive')
  OR employee_id IN (SELECT id FROM employees WHERE department_id = get_user_dept_id())
  OR employee_id = get_user_emp_id()
);

-- audit_logs (admin only select, all can insert)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (true);

-- departments (all read, admin/hr write)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS departments_select ON departments;
CREATE POLICY departments_select ON departments FOR SELECT USING (true);
DROP POLICY IF EXISTS departments_insert ON departments;
CREATE POLICY departments_insert ON departments FOR INSERT WITH CHECK (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS departments_update ON departments;
CREATE POLICY departments_update ON departments FOR UPDATE USING (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS departments_delete ON departments;
CREATE POLICY departments_delete ON departments FOR DELETE USING (get_user_role() = 'admin');

-- positions (all read, admin/hr write)
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS positions_select ON positions;
CREATE POLICY positions_select ON positions FOR SELECT USING (true);
DROP POLICY IF EXISTS positions_insert ON positions;
CREATE POLICY positions_insert ON positions FOR INSERT WITH CHECK (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS positions_update ON positions;
CREATE POLICY positions_update ON positions FOR UPDATE USING (get_user_role() IN ('admin','hr'));

-- shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shifts_select ON shifts;
CREATE POLICY shifts_select ON shifts FOR SELECT USING (true);
DROP POLICY IF EXISTS shifts_insert ON shifts;
CREATE POLICY shifts_insert ON shifts FOR INSERT WITH CHECK (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS shifts_update ON shifts;
CREATE POLICY shifts_update ON shifts FOR UPDATE USING (get_user_role() IN ('admin','hr'));

-- schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schedules_select ON schedules;
CREATE POLICY schedules_select ON schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS schedules_insert ON schedules;
CREATE POLICY schedules_insert ON schedules FOR INSERT WITH CHECK (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS schedules_update ON schedules;
CREATE POLICY schedules_update ON schedules FOR UPDATE USING (get_user_role() IN ('admin','hr'));

-- announcements (admin/hr write, all read)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS announcements_select ON announcements;
CREATE POLICY announcements_select ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS announcements_insert ON announcements;
CREATE POLICY announcements_insert ON announcements FOR INSERT WITH CHECK (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS announcements_update ON announcements;
CREATE POLICY announcements_update ON announcements FOR UPDATE USING (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS announcements_delete ON announcements;
CREATE POLICY announcements_delete ON announcements FOR DELETE USING (get_user_role() IN ('admin','hr'));

-- company_core_values (all read, admin write)
ALTER TABLE company_core_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_core_values_select ON company_core_values;
CREATE POLICY company_core_values_select ON company_core_values FOR SELECT USING (true);
DROP POLICY IF EXISTS company_core_values_insert ON company_core_values;
CREATE POLICY company_core_values_insert ON company_core_values FOR INSERT WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS company_core_values_update ON company_core_values;
CREATE POLICY company_core_values_update ON company_core_values FOR UPDATE USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS company_core_values_delete ON company_core_values;
CREATE POLICY company_core_values_delete ON company_core_values FOR DELETE USING (get_user_role() = 'admin');

-- overtime_settings (admin/hr write)
ALTER TABLE overtime_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS overtime_settings_select ON overtime_settings;
CREATE POLICY overtime_settings_select ON overtime_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS overtime_settings_insert ON overtime_settings;
CREATE POLICY overtime_settings_insert ON overtime_settings FOR INSERT WITH CHECK (get_user_role() IN ('admin','hr'));
DROP POLICY IF EXISTS overtime_settings_update ON overtime_settings;
CREATE POLICY overtime_settings_update ON overtime_settings FOR UPDATE USING (get_user_role() IN ('admin','hr'));
