-- =============================================
-- PERFORMANCE OPTIMIZATION: Missing indexes
-- =============================================

-- Attendance: standalone date index (for date-range-only filtering)
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (attendance_date);

-- Attendance: shift name for sorting
CREATE INDEX IF NOT EXISTS idx_attendance_shift_name ON attendance (shift_name);

-- Attendance: overtime detection
CREATE INDEX IF NOT EXISTS idx_attendance_actual_check_in ON attendance (actual_check_in);
CREATE INDEX IF NOT EXISTS idx_attendance_actual_check_out ON attendance (actual_check_out);
CREATE INDEX IF NOT EXISTS idx_attendance_scheduled_check_in ON attendance (scheduled_check_in);
CREATE INDEX IF NOT EXISTS idx_attendance_scheduled_check_out ON attendance (scheduled_check_out);

-- Approvals: status for filtering pending
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals (status);

-- Leave requests: created_at for sorting
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests (created_at);

-- Overtime records: FK and status
CREATE INDEX IF NOT EXISTS idx_overtime_records_attendance_id ON overtime_records (attendance_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_employee_id ON overtime_records (employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_status ON overtime_records (status);

-- Announcements: filter + sort
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements (is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements (published_at);

-- Company core values: sort order
CREATE INDEX IF NOT EXISTS idx_core_values_display_order ON company_core_values (display_order);

-- Attendance imports: FK
CREATE INDEX IF NOT EXISTS idx_attendance_imports_uploaded_by ON attendance_imports (uploaded_by);
