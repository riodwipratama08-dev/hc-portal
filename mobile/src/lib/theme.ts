export const colors = {
  teal: "#0d9488",
  tealLight: "#f0fdfa",
  rose: "#fb7185",
  primary: "#2563eb",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#d97706",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  grayDark: "#374151",
  white: "#ffffff",
  background: "#f9fafb",
  border: "#e5e7eb",
};

export const statusColors: Record<string, string> = {
  hadir: colors.success,
  hadir_lembur: colors.success,
  tidak_hadir: colors.danger,
  libur_umum: colors.gray,
  libur_rutin: colors.gray,
  cuti: colors.warning,
  izin: "#ea580c",
};

export const statusLabels: Record<string, string> = {
  hadir: "Hadir", hadir_lembur: "Hadir (Lbr)", tidak_hadir: "Tidak Hadir",
  libur_umum: "Libur Umum", libur_rutin: "Libur Rutin", cuti: "Cuti", izin: "Izin",
};
