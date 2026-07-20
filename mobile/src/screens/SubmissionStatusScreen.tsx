import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

const statusColorsMap: Record<string, string> = {
  pending: colors.warning, approved: colors.success, rejected: colors.danger, cancelled: colors.gray,
};

export default function SubmissionStatusScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: emp } = await supabase.from("employees").select("id").eq("email", user.email).single();
    if (!emp) return;

    let q = supabase.from("leave_requests").select("id, start_date, end_date, status, custom_reason_label, created_at, approvals(level, status, notes, employees!inner(full_name))")
      .eq("employee_id", emp.id).order("created_at", { ascending: false }).limit(20);
    if (filterStatus) q = q.eq("status", filterStatus);
    const { data } = await q;
    setRequests(data ?? []);
  }

  useEffect(() => { loadData(); }, [filterStatus]);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {["", "pending", "approved", "rejected"].map((s) => (
          <Text key={s} onPress={() => setFilterStatus(s)} style={[styles.chip, filterStatus === s && { backgroundColor: colors.teal, color: "#fff" }]}>{s || "All"}</Text>
        ))}
      </ScrollView>

      {requests.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={[styles.statusBar, { backgroundColor: statusColorsMap[r.status] }]} />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.dates}>{r.start_date} — {r.end_date}</Text>
              <Text style={[styles.badge, { color: "#fff", backgroundColor: statusColorsMap[r.status] }]}>{r.status}</Text>
            </View>
            <Text style={styles.reason}>{r.custom_reason_label || r.leave_reasons?.label || "-"}</Text>
            {r.approvals?.map((a: any) => (
              <Text key={a.id} style={styles.approval}>Level {a.level}: {a.employees?.full_name} → {a.status}{a.notes ? `: ${a.notes}` : ""}</Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginRight: 8, fontSize: 12, overflow: "hidden" },
  card: { backgroundColor: colors.white, borderRadius: 8, marginBottom: 8, flexDirection: "row", borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  statusBar: { width: 4 },
  cardBody: { flex: 1, padding: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  dates: { fontWeight: "700", fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, fontSize: 10, fontWeight: "600", overflow: "hidden" },
  reason: { fontSize: 12, color: colors.gray, marginBottom: 4 },
  approval: { fontSize: 11, color: colors.grayDark, marginTop: 2 },
});
