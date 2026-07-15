-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4.1 departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_departments_name ON departments (name);
CREATE UNIQUE INDEX idx_departments_code ON departments (code);

-- 4.2 positions
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_positions_department_id ON positions (department_id);

-- 4.3 employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
  join_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resigned', 'terminated')),
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'hr', 'manager', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_employees_employee_code ON employees (employee_code);
CREATE UNIQUE INDEX idx_employees_email ON employees (email);
CREATE INDEX idx_employees_department_id ON employees (department_id);
CREATE INDEX idx_employees_position_id ON employees (position_id);
CREATE INDEX idx_employees_status ON employees (status);
CREATE INDEX idx_employees_role ON employees (role);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
