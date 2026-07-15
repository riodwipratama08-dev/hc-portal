-- 4.10 leave_categories
CREATE TABLE leave_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  affects_payroll_or_attendance BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 leave_reasons
CREATE TABLE leave_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES leave_categories(id) ON DELETE CASCADE,
  label TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.12 leave_requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reason_id UUID REFERENCES leave_reasons(id) ON DELETE SET NULL,
  custom_reason_label TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  additional_notes TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.13 approvals (berjenjang)
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1 CHECK (level IN (1, 2)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes TEXT,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.14 leave_balances
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_category_id UUID NOT NULL REFERENCES leave_categories(id) ON DELETE CASCADE,
  year INT NOT NULL,
  total_days NUMERIC NOT NULL DEFAULT 12,
  used_days NUMERIC NOT NULL DEFAULT 0,
  remaining_days NUMERIC NOT NULL DEFAULT 12,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_category_id, year)
);

CREATE INDEX idx_leave_requests_employee ON leave_requests (employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests (status);
CREATE INDEX idx_approvals_approver ON approvals (approver_id);
CREATE INDEX idx_approvals_request ON approvals (leave_request_id);
CREATE INDEX idx_leave_balances_employee ON leave_balances (employee_id);

CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
