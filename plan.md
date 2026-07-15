# PLAN.md — HR Portal (hc-portal-malilkids)

> **Cara pakai file ini:** Tempelkan/lampirkan seluruh isi file ini di awal setiap sesi vibe coding baru.
> Kerjakan **satu modul per sesi** (lihat Roadmap). Jangan minta AI membuat semua modul sekaligus.
> Gunakan git dari commit pertama. Minta AI membuat skema database dulu sebelum membuat UI.

---

## 1. Ringkasan Project

HR Portal internal dengan modul:
- HR & Karyawan
- Attendance (absensi, termasuk import rekap CSV dari mesin fingerprint)
- Shift & Jadwal
- Approval Harian (izin/cuti/lembur)
- Laporan & Analytics
- Security & Maintenance
- Mobile Native (untuk karyawan: absen, ajukan izin, lihat jadwal)

## 2. Roles (Peran Pengguna)

| Role | Akses |
|---|---|
| Super Admin | Akses penuh, setting sistem, audit log |
| HR Admin | Kelola data karyawan, approval level akhir, laporan |
| Manager/Supervisor | Approval level pertama untuk tim, lihat jadwal & attendance tim |
| Karyawan | Lihat jadwal sendiri, ajukan izin/cuti, lihat riwayat attendance |

## 3. Tech Stack

| Bagian | Pilihan | Alasan |
|---|---|---|
| Web Portal | Next.js + TypeScript + Tailwind | Dokumentasi lengkap, AI paling terlatih di stack ini |
| Database & Backend | Supabase (PostgreSQL) | Auto-generate API, Auth & Row Level Security bawaan |
| Mobile Native | React Native (Expo) | Share tipe data & logic dengan web, tetap native |
| Hosting | Vercel (web) + EAS Build (mobile) | Mudah deploy, gratis di tahap awal |

**Prinsip:** satu bahasa (TypeScript) di web & mobile, database jelas sejak awal — supaya AI tidak "mengarang" struktur data sendiri.

---

## 4. Skema Database (Terkonfirmasi)

### 4.1 `departments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| name | text | nama departemen |
| code | text | kode singkat |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 4.2 `positions`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| title | text | nama jabatan |
| department_id | uuid (FK → departments.id) | |
| level | int | hierarki approval (1=staff, 2=supervisor, 3=manager) |
| created_at | timestamptz | |

### 4.3 `employees`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| employee_code | text (unique) | NIK/NIP internal, dipakai cocokkan dengan CSV absensi |
| full_name | text | |
| nickname | text (nullable) | nama panggilan |
| email | text (unique) | untuk login |
| phone | text | |
| address | text (nullable) | opsional |
| department_id | uuid (FK) | |
| position_id | uuid (FK) | |
| join_date | date | |
| status | text | 'active', 'resigned', 'terminated' |
| role | text | 'admin', 'hr', 'manager', 'employee' |
| created_at / updated_at | timestamptz | |

### 4.4 `shifts` (definisi jam kerja)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| name | text | misal "SENIN-JUMAT", "SHIFT SIANG SENIN-KAMIS 2" |
| start_time | time | |
| end_time | time | |
| applicable_days | jsonb | array hari berlaku |
| is_active | boolean | default true |

### 4.5 `schedules` (grup jadwal induk)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| name | text | misal "JADWAL INVENTORI & JAHIT", "JADWAL AUTO GA" |
| description | text (nullable) | |
| is_active | boolean | default true |

### 4.6 `schedule_shifts` (relasi schedule ↔ shift)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| schedule_id | uuid (FK → schedules.id) | |
| shift_id | uuid (FK → shifts.id) | |

### 4.7 `employee_schedules` (histori jadwal per karyawan)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| employee_id | uuid (FK → employees.id) | |
| schedule_id | uuid (FK → schedules.id) | |
| effective_start | date | |
| effective_end | date (nullable) | null = masih berlaku |

### 4.8 `attendance`
| Kolom | Tipe | Asal CSV | Keterangan |
|---|---|---|---|
| id | uuid (PK) | – | |
| employee_id | uuid (FK → employees.id) | NIP/PIN | dicocokkan via employee_code |
| attendance_date | date | Tanggal | |
| schedule_name | text (nullable) | Jadwal | |
| shift_name | text (nullable) | Jam kerja | |
| status | enum | (dihitung) | 'hadir','tidak_hadir','libur_umum','libur_rutin','cuti','izin' |
| is_valid | boolean | Valid | |
| is_public_holiday | boolean | Libur umum | |
| is_routine_day_off | boolean | Libur rutin | |
| office_location | text | Kantor | |
| scheduled_check_in | time (nullable) | Jam Masuk | |
| actual_check_in | time (nullable) | Scan masuk | |
| check_in_device_sn | text (nullable) | SN scan masuk | |
| late_permission | boolean | Izin terlambat | |
| late_minutes | int | Terlambat | |
| break_check_1 | time (nullable) | Scan Istirahat 1 | |
| break_check_2 | time (nullable) | Scan Istirahat 2 | |
| break_minutes | int | Istirahat | |
| overtime_break_minutes | int | Lembur istirahat | |
| early_leave_permission | boolean | Izin pulang awal | |
| early_leave_minutes | int | Pulang awal | |
| scheduled_check_out | time (nullable) | Jam Pulang | |
| actual_check_out | time (nullable) | Scan pulang | |
| check_out_device_sn | text (nullable) | SN scan pulang | |
| duration_minutes | int | Durasi | |
| is_counted | boolean | Dihitung | |
| overtime_minutes | int | Lembur akhir | |
| remarks | text (nullable) | Keterangan | |
| import_batch_id | uuid (FK → attendance_imports.id, nullable) | – | |
| created_at | timestamptz | – | |

> Catatan: kolom `Jabatan`/`Departemen` dari CSV **tidak disimpan** di sini (redundan dengan tabel `employees`).

### 4.9 `attendance_imports`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| file_name | text | nama file CSV asli |
| period_start | date | |
| period_end | date | |
| total_rows | int | |
| uploaded_by | uuid (FK → employees.id) | |
| uploaded_at | timestamptz | |
| status | text | 'success', 'partial', 'failed' |

### 4.10 `leave_categories` (kategori umum — 19 kategori, lihat seed data §5)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| name | text (unique) | |
| affects_payroll_or_attendance | boolean | |
| is_active | boolean | default true |
| created_at | timestamptz | |

### 4.11 `leave_reasons` (alasan spesifik — 56 alasan, lihat seed data §5)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| category_id | uuid (FK → leave_categories.id) | |
| label | text (unique) | |
| is_active | boolean | default true |
| created_at | timestamptz | |

### 4.12 `leave_requests`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| employee_id | uuid (FK → employees.id) | |
| reason_id | uuid (FK → leave_reasons.id, **nullable**) | |
| custom_reason_label | text (nullable) | diisi kalau alasan belum ada di daftar |
| start_date | date | |
| end_date | date | |
| start_time | time (nullable) | untuk kasus per-jam |
| end_time | time (nullable) | |
| additional_notes | text (nullable) | |
| attachment_url | text (nullable) | |
| status | enum | 'pending','approved','rejected','cancelled' |
| created_at / updated_at | timestamptz | |

### 4.13 `approvals` (approval berjenjang)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| leave_request_id | uuid (FK → leave_requests.id) | |
| approver_id | uuid (FK → employees.id) | |
| level | int | 1 = atasan langsung, 2 = HR, dst |
| status | enum | 'pending','approved','rejected' |
| notes | text (nullable) | |
| acted_at | timestamptz (nullable) | |
| created_at | timestamptz | |

### 4.14 `leave_balances`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| employee_id | uuid (FK → employees.id) | |
| leave_category_id | uuid (FK → leave_categories.id) | |
| year | int | |
| total_days | numeric | |
| used_days | numeric | |
| remaining_days | numeric | |
| updated_at | timestamptz | |

### 4.15 `audit_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid (PK) | |
| actor_id | uuid (FK → employees.id, nullable) | null = sistem |
| action | text | misal "approve_leave", "edit_employee" |
| entity_type | text | nama tabel yang kena efek |
| entity_id | uuid | |
| metadata | jsonb (nullable) | before/after |
| ip_address | text (nullable) | |
| created_at | timestamptz | |

---

## 5. Seed Data — Kategori & Alasan Izin (19 kategori, 56 alasan)

Sumber: `Kategori_keterangan_izin.xls` (data rutin perusahaan).

**Cuti normatif**
- Cuti Normatif Nikah Disetujui Atasan

**Cuti pribadi**
- Cuti Disetujui Atasan
- Disetujui SPV
- Liburan

**Izin datang terlambat (Keperluan kantor)**
- Delay Penerbangan

**Izin datang terlambat (Keperluan pribadi)**
- Antar anak imunisasi
- Bikin Rekening BCA
- Izin Telat
- Izin Telat Ke Dokter
- Izin mengurusi SIM/STNK/Pajak
- Motor Mogok
- Telat (Bangun Kesiangan)
- Toleransi datang terlambat

**Izin dinas (Izin keperluan kantor)**
- Training Ke Kantor Cabang

**Izin lain-lain**
- Absen
- BR4 belum dibuka
- Bencana Alam
- Cek Kesehatan
- Cuti
- Izin
- Izin Keperluan
- Izin Sakit
- Keperluan
- Keperluan Keluarga
- Masuk
- Perpanjang SIM
- Ubah jam kerja

**Izin libur**
- Keperluan Pribadi

**Izin meninggalkan tempat kerja**
- Izin Pergi Keluar
- Mengurus BPJS Pegawai

**Izin pulang awal (Keperluan kantor)**
- Mengikuti Jadwal Keberangkatan Pesawat

**Izin pulang awal (Keperluan pribadi)**
- Ada Keperluan Keluarga
- Izin Pulang Lebih Awal
- Izin UAS
- Mengurus NPWP
- Pulang Awal Karena Sakit

**Izin tidak masuk (Keperluan pribadi)**
- Acara Keluarga
- Alasan Pribadi (Duka Cita)
- Izin Cuti Istri Melahirkan
- Izin Sedang Ada Ujian
- Izin Tidak Masuk
- Kebanjiran

**Sakit dengan surat dokter**
- Sakit Rawat Jalan

**Sakit tanpa surat dokter**
- Disetujui Atasan
- Sakit Disetujui Atasan
- Sakit Tidak Masuk

**Tidak scan (masuk)**
- Lupa Scan Masuk
- Tidak Bisa Scan Masuk

**Tidak scan (mulai istirahat)**
- Lupa Scan Mulai Istirahat

**Tidak scan (mulai lembur)**
- Lupa Scan Mulai Lembur

**Tidak scan (pulang)**
- Izin Keperluan Keluarga
- Izin Pulang Karena Sakit
- Lupa Scan Pulang
- Tidak Bisa Scan Pulang

**Tidak scan (selesai istirahat)**
- Lupa Scan Selesai Istirahat

**Tidak scan (selesai lembur)**
- Lupa Scan Selesai Lembur

> Catatan: daftar ini bisa terus bertambah. Alur untuk alasan baru: karyawan pilih "Lainnya" → isi `custom_reason_label` → HR/Admin review lalu tambahkan ke `leave_reasons` lewat portal (tanpa perlu ubah kode).

---

## 6. Format CSV Rekap Absensi (untuk fitur import)

File referensi: `Absensi_25_Mei_-_23_Juni_2026.csv` — ekspor dari mesin fingerprint, delimiter `;`.

Kolom asli: `Tanggal;Jadwal;Jam kerja;Valid;PIN;NIP;Nama;Jabatan;Departemen;Kantor;Libur umum;Libur rutin;Lembur;Jam Masuk;Scan masuk;SN scan masuk;Izin terlambat;Terlambat;Scan Istirahat 1;Scan Istirahat 2;Istirahat;Lembur istirahat;Izin pulang awal;Pulang awal;Jam Pulang;Scan pulang;SN scan pulang;Durasi;Dihitung;Lembur akhir;Keterangan`

Pemetaan kolom CSV → tabel `attendance` sudah tercantum lengkap di §4.8. Saat import:
1. Cocokkan `NIP`/`PIN` dengan `employees.employee_code` — kalau tidak ketemu, tandai baris sebagai gagal (jangan buat karyawan baru otomatis).
2. Simpan 1 baris di `attendance_imports` per file yang diupload.
3. Format tanggal CSV: `DD-MM-YYYY` → perlu konversi ke `YYYY-MM-DD` saat insert.
4. Format `00:00:00` pada kolom jam = kosong/tidak ada aktivitas (bukan tengah malam).

---

## 7. Roadmap (Kerjakan Bertahap, Jangan Sekaligus)

**Fase 1 — MVP**
- Setup project (Next.js + Supabase) + auth + role
- Tabel: departments, positions, employees
- CRUD data karyawan (HR Admin)

**Fase 2 — Attendance**
- Tabel: shifts, schedules, schedule_shifts, employee_schedules
- Tabel: attendance, attendance_imports
- Fitur import CSV rekap absensi + preview sebelum commit ke database

**Fase 3 — Approval Harian**
- Tabel: leave_categories, leave_reasons, leave_requests, approvals, leave_balances
- Seed data 19 kategori & 56 alasan (§5)
- Alur pengajuan → approval berjenjang → update leave_balances

**Fase 4 — Laporan & Analytics**
- Dashboard rekap kehadiran, keterlambatan, penggunaan cuti per departemen/periode

**Fase 5 — Security & Maintenance**
- Tabel audit_logs, Row Level Security per role di Supabase
- Setting sistem, manajemen user

**Fase 6 — Mobile Native**
- React Native (Expo): absen, lihat jadwal, ajukan izin, lihat status approval

---

## 8. Cara Pakai Plan Ini Saat Vibe Coding

1. Buka sesi baru → tempelkan file ini sebagai konteks
2. Sebutkan **fase/modul mana** yang mau dikerjakan (jangan minta semua sekaligus)
3. Minta AI buat migration/schema database dulu sesuai §4, baru minta UI
4. Commit ke git setiap selesai 1 fitur kecil
5. Kalau ada kebutuhan tabel/kolom baru di tengah jalan, update file ini dulu (tambah draft, konfirmasi ke diri sendiri/tim), baru lanjut coding — supaya plan ini selalu jadi sumber kebenaran tunggal (single source of truth)
