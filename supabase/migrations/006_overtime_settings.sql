ALTER TABLE overtime_records ALTER COLUMN overtime_minutes DROP NOT NULL;
ALTER TABLE overtime_records ADD CONSTRAINT overtime_records_minutes_check CHECK (overtime_minutes >= 30);

CREATE TABLE overtime_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL UNIQUE REFERENCES departments(id) ON DELETE CASCADE,
  minimum_overtime_minutes INT NOT NULL DEFAULT 30,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_overtime_settings_updated_at BEFORE UPDATE ON overtime_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
