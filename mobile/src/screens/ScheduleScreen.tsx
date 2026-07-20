import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: emp } = await supabase.from("employees").select("id").eq("email", user.email).single();
      if (!emp) return;

      const { data } = await supabase
        .from("employee_schedules")
        .select("id, effective_start, effective_end, schedule_id")
        .eq("employee_id", emp.id)
        .is("effective_end", null);
      setSchedules(data ?? []);
    })();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Current Schedule</Text>
      {schedules.length === 0 && <Text style={styles.empty}>No schedule assigned yet. Contact HR/Admin to set your schedule.</Text>}
      {schedules.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.label}>Schedule active since {s.effective_start}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.grayDark, marginBottom: 8 },
  empty: { fontSize: 13, color: colors.gray, fontStyle: "italic", textAlign: "center", marginTop: 32 },
  card: { backgroundColor: colors.white, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 13, color: colors.grayDark },
});
