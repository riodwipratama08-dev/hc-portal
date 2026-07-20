import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, statusColors, statusLabels } from "../lib/theme";

export default function AttendanceScreen() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: emp } = await supabase.from("employees").select("id").eq("email", user.email).single();
    if (!emp) return;

    let q = supabase.from("attendance").select("id, attendance_date, status, shift_name, scheduled_check_in, actual_check_in, scheduled_check_out, actual_check_out, remarks, late_minutes")
      .eq("employee_id", emp.id).order("attendance_date", { ascending: false }).limit(50);
    if (filterStatus) q = q.eq("status", filterStatus);
    const { data } = await q;
    setAttendance(data ?? []);
  }

  useEffect(() => { loadData(); }, [filterStatus]);

  const statuses = ["", "hadir", "hadir_lembur", "tidak_hadir", "libur_umum", "libur_rutin", "cuti", "izin"];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {statuses.map((s) => (
            <TouchableOpacity key={s} onPress={() => setFilterStatus(s)}
              style={[styles.filterChip, filterStatus === s && { backgroundColor: colors.teal }]}>
              <Text style={[styles.filterChipText, filterStatus === s && { color: colors.white }]}>{s ? statusLabels[s] ?? s : "All"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {attendance.map((a) => (
        <View key={a.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.date}>{a.attendance_date}</Text>
            <Text style={[styles.badge, { color: "#fff", backgroundColor: statusColors[a.status] || colors.gray }]}>
              {statusLabels[a.status] ?? a.status}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.label}>{a.shift_name || "-"} — In: {a.actual_check_in?.slice(0,5) || "-"} Out: {a.actual_check_out?.slice(0,5) || "-"}</Text>
            {a.late_minutes > 0 && <Text style={{ color: colors.warning, fontSize: 12 }}>Terlambat {a.late_minutes}m</Text>}
            <Text style={styles.remarks}>{a.remarks || ""}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterChipText: { fontSize: 12, color: colors.grayDark },
  card: { backgroundColor: colors.white, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  date: { fontWeight: "700", fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 10, fontWeight: "600", overflow: "hidden" },
  cardBody: { padding: 10 },
  label: { fontSize: 12, color: colors.grayDark },
  remarks: { fontSize: 11, color: colors.gray, fontStyle: "italic", marginTop: 2 },
});
