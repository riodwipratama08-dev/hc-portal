import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, statusLabels } from "../lib/theme";

export default function DashboardScreen() {
  const [emp, setEmp] = useState<any>(null);
  const [coreValues, setCoreValues] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: e } = await supabase.from("employees").select("id, role, department_id").eq("email", user.email).single();
    setEmp(e);

    const { data: cv } = await supabase.from("company_core_values").select("*").eq("is_active", true).order("display_order");
    setCoreValues(cv ?? []);

    const { data: an } = await supabase.from("announcements").select("*, employees!inner(full_name)").eq("is_active", true).order("is_pinned", { ascending: false }).order("published_at", { ascending: false }).limit(5);
    setAnnouncements(an ?? []);

    if (e?.id) {
      const now = new Date(); const mo = String(now.getMonth() + 1).padStart(2, "0"); const yr = now.getFullYear();
      const lastDay = String(new Date(yr, now.getMonth() + 1, 0).getDate());
      const { data: att } = await supabase.from("attendance").select("status, late_minutes").eq("employee_id", e.id)
        .gte("attendance_date", `${yr}-${mo}-01`).lte("attendance_date", `${yr}-${mo}-${lastDay}`);
      if (att) setStats({
        hadir: att.filter((a: any) => a.status === "hadir" || a.status === "hadir_lembur").length,
        tidakHadir: att.filter((a: any) => a.status === "tidak_hadir").length,
        terlambat: att.filter((a: any) => a.late_minutes > 0).length,
      });
    }
  }

  useEffect(() => { loadData(); }, []);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.sectionTitle}>Core Values</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {coreValues.map((cv) => (
          <View key={cv.id} style={styles.cvCard}>
            <Text style={styles.cvIcon}>{cv.icon || "✨"}</Text>
            <Text style={styles.cvTitle}>{cv.title}</Text>
            <Text style={styles.cvDesc}>{cv.description}</Text>
          </View>
        ))}
      </ScrollView>

      {stats && (
        <View><Text style={styles.sectionTitle}>My Summary</Text>
          <View style={styles.statRow}>
            <View style={styles.statCard}><Text style={styles.statNumGreen}>{stats.hadir}</Text><Text style={styles.statLabel}>Hadir</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumRed}>{stats.tidakHadir}</Text><Text style={styles.statLabel}>Tidak Hadir</Text></View>
            <View style={styles.statCard}><Text style={styles.statNumYellow}>{stats.terlambat}</Text><Text style={styles.statLabel}>Terlambat</Text></View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Announcements</Text>
      {announcements.map((a) => (
        <View key={a.id} style={[styles.annCard, a.is_pinned && { borderColor: colors.teal }]}>
          <Text style={styles.annTitle}>{a.is_pinned ? "📌 " : ""}{a.title}</Text>
          <Text style={styles.annMeta}>{a.employees?.full_name} · {new Date(a.published_at).toLocaleDateString("id-ID")}</Text>
          <Text style={styles.annContent}>{a.content}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.grayDark, marginBottom: 8, marginTop: 8 },
  cvCard: { backgroundColor: colors.white, borderRadius: 12, padding: 12, marginRight: 10, width: 140, borderWidth: 1, borderColor: colors.border },
  cvIcon: { fontSize: 28, marginBottom: 4 }, cvTitle: { fontWeight: "700", fontSize: 13, marginBottom: 2 }, cvDesc: { fontSize: 11, color: colors.gray },
  statRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 8, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  statNumGreen: { fontSize: 24, fontWeight: "bold", color: colors.success },
  statNumRed: { fontSize: 24, fontWeight: "bold", color: colors.danger },
  statNumYellow: { fontSize: 24, fontWeight: "bold", color: colors.warning },
  statLabel: { fontSize: 11, color: colors.gray, marginTop: 2 },
  annCard: { backgroundColor: colors.white, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  annTitle: { fontWeight: "700", fontSize: 14, marginBottom: 2 },
  annMeta: { fontSize: 10, color: colors.gray, marginBottom: 6 },
  annContent: { fontSize: 12, color: colors.grayDark },
});
