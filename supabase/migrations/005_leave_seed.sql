-- =============================================
-- SEED DATA: 19 kategori, 56 alasan (plan §5)
-- =============================================

-- 1. Cuti normatif
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Cuti normatif', true);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Cuti normatif')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Cuti Normatif Nikah Disetujui Atasan');

-- 2. Cuti pribadi
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Cuti pribadi', true);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Cuti pribadi')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Cuti Disetujui Atasan'),
  ((SELECT id FROM cat), 'Disetujui SPV'),
  ((SELECT id FROM cat), 'Liburan');

-- 3. Izin datang terlambat (Keperluan kantor)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin datang terlambat (Keperluan kantor)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin datang terlambat (Keperluan kantor)')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Delay Penerbangan');

-- 4. Izin datang terlambat (Keperluan pribadi)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin datang terlambat (Keperluan pribadi)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin datang terlambat (Keperluan pribadi)')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Antar anak imunisasi'),
  ((SELECT id FROM cat), 'Bikin Rekening BCA'),
  ((SELECT id FROM cat), 'Izin Telat'),
  ((SELECT id FROM cat), 'Izin Telat Ke Dokter'),
  ((SELECT id FROM cat), 'Izin mengurusi SIM/STNK/Pajak'),
  ((SELECT id FROM cat), 'Motor Mogok'),
  ((SELECT id FROM cat), 'Telat (Bangun Kesiangan)'),
  ((SELECT id FROM cat), 'Toleransi datang terlambat');

-- 5. Izin dinas (Izin keperluan kantor)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin dinas (Izin keperluan kantor)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin dinas (Izin keperluan kantor)')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Training Ke Kantor Cabang');

-- 6. Izin lain-lain
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin lain-lain', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin lain-lain')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Absen'), ((SELECT id FROM cat), 'BR4 belum dibuka'),
  ((SELECT id FROM cat), 'Bencana Alam'), ((SELECT id FROM cat), 'Cek Kesehatan'),
  ((SELECT id FROM cat), 'Cuti'), ((SELECT id FROM cat), 'Izin'),
  ((SELECT id FROM cat), 'Izin Keperluan'), ((SELECT id FROM cat), 'Izin Sakit'),
  ((SELECT id FROM cat), 'Keperluan'), ((SELECT id FROM cat), 'Keperluan Keluarga'),
  ((SELECT id FROM cat), 'Masuk'), ((SELECT id FROM cat), 'Perpanjang SIM'),
  ((SELECT id FROM cat), 'Ubah jam kerja');

-- 7. Izin libur
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin libur', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin libur')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Keperluan Pribadi');

-- 8. Izin meninggalkan tempat kerja
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin meninggalkan tempat kerja', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin meninggalkan tempat kerja')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Izin Pergi Keluar'), ((SELECT id FROM cat), 'Mengurus BPJS Pegawai');

-- 9. Izin pulang awal (Keperluan kantor)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin pulang awal (Keperluan kantor)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin pulang awal (Keperluan kantor)')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Mengikuti Jadwal Keberangkatan Pesawat');

-- 10. Izin pulang awal (Keperluan pribadi)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin pulang awal (Keperluan pribadi)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin pulang awal (Keperluan pribadi)')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Ada Keperluan Keluarga'), ((SELECT id FROM cat), 'Izin Pulang Lebih Awal'),
  ((SELECT id FROM cat), 'Izin UAS'), ((SELECT id FROM cat), 'Mengurus NPWP'),
  ((SELECT id FROM cat), 'Pulang Awal Karena Sakit');

-- 11. Izin tidak masuk (Keperluan pribadi)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Izin tidak masuk (Keperluan pribadi)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Izin tidak masuk (Keperluan pribadi)')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Acara Keluarga'), ((SELECT id FROM cat), 'Alasan Pribadi (Duka Cita)'),
  ((SELECT id FROM cat), 'Izin Cuti Istri Melahirkan'), ((SELECT id FROM cat), 'Izin Sedang Ada Ujian'),
  ((SELECT id FROM cat), 'Izin Tidak Masuk'), ((SELECT id FROM cat), 'Kebanjiran');

-- 12. Sakit dengan surat dokter
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Sakit dengan surat dokter', true);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Sakit dengan surat dokter')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Sakit Rawat Jalan');

-- 13. Sakit tanpa surat dokter
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Sakit tanpa surat dokter', true);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Sakit tanpa surat dokter')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Disetujui Atasan'), ((SELECT id FROM cat), 'Sakit Disetujui Atasan'),
  ((SELECT id FROM cat), 'Sakit Tidak Masuk');

-- 14. Tidak scan (masuk)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Tidak scan (masuk)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Tidak scan (masuk)')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Lupa Scan Masuk'), ((SELECT id FROM cat), 'Tidak Bisa Scan Masuk');

-- 15. Tidak scan (mulai istirahat)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Tidak scan (mulai istirahat)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Tidak scan (mulai istirahat)')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Lupa Scan Mulai Istirahat');

-- 16. Tidak scan (mulai lembur)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Tidak scan (mulai lembur)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Tidak scan (mulai lembur)')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Lupa Scan Mulai Lembur');

-- 17. Tidak scan (pulang)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Tidak scan (pulang)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Tidak scan (pulang)')
INSERT INTO leave_reasons (category_id, label) VALUES
  ((SELECT id FROM cat), 'Izin Keperluan Keluarga'), ((SELECT id FROM cat), 'Izin Pulang Karena Sakit'),
  ((SELECT id FROM cat), 'Lupa Scan Pulang'), ((SELECT id FROM cat), 'Tidak Bisa Scan Pulang');

-- 18. Tidak scan (selesai istirahat)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Tidak scan (selesai istirahat)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Tidak scan (selesai istirahat)')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Lupa Scan Selesai Istirahat');

-- 19. Tidak scan (selesai lembur)
INSERT INTO leave_categories (name, affects_payroll_or_attendance) VALUES ('Tidak scan (selesai lembur)', false);
WITH cat AS (SELECT id FROM leave_categories WHERE name = 'Tidak scan (selesai lembur)')
INSERT INTO leave_reasons (category_id, label) VALUES ((SELECT id FROM cat), 'Lupa Scan Selesai Lembur');
