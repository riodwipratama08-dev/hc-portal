ALTER TABLE overtime_settings ADD COLUMN IF NOT EXISTS overtime_type TEXT NOT NULL DEFAULT 'per_hari' CHECK (overtime_type IN ('per_hari', 'tunjangan_bulanan'));
