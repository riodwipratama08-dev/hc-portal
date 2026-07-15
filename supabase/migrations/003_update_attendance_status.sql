ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('hadir','hadir_lembur','tidak_hadir','libur_umum','libur_rutin','cuti','izin'));
