import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

export default function LeaveRequestScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("leave_categories").select("*, leave_reasons(id, label, is_active)").eq("is_active", true).order("name").then(({ data }) => setCategories(data ?? []));
  }, []);

  const reasons = categories.find((c) => c.id === selectedCategory)?.leave_reasons?.filter((r: any) => r.is_active) ?? [];

  async function handleSubmit() {
    if (!selectedCategory || !(selectedReason || customReason) || !startDate || !endDate) {
      Alert.alert("Error", "Please fill all required fields"); return;
    }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    const { data: emp } = await supabase.from("employees").select("id, department_id, position_id").eq("email", user.email).single();
    if (!emp) { setSubmitting(false); return; }

    const { error: reqErr } = await supabase.from("leave_requests").insert({
      employee_id: emp.id, reason_id: selectedReason || null, custom_reason_label: customReason || null,
      start_date: startDate, end_date: endDate, additional_notes: notes || null, status: "pending",
    }).select().single();

    if (reqErr) { Alert.alert("Error", reqErr.message); setSubmitting(false); return; }

    // Determine approver (same logic as web)
    const { data: top } = await supabase.from("employees").select("id, positions!inner(level)")
      .eq("department_id", emp.department_id).eq("status", "active").neq("id", emp.id)
      .order("level", { referencedTable: "positions", ascending: false }).limit(1).maybeSingle();
    const { data: hr } = await supabase.from("employees").select("id").eq("role", "hr").eq("status", "active").limit(1).maybeSingle();

    if (top) {
      await supabase.from("approvals").insert({ leave_request_id: emp.id, approver_id: top.id, level: 1, status: "pending" });
      if (hr && hr.id !== top.id) await supabase.from("approvals").insert({ leave_request_id: emp.id, approver_id: hr.id, level: 2, status: "pending" });
    } else if (hr) {
      await supabase.from("approvals").insert({ leave_request_id: emp.id, approver_id: hr.id, level: 2, status: "pending" });
    }

    setSubmitting(false);
    Alert.alert("Success", "Leave request submitted!");
    setSelectedCategory(""); setSelectedReason(""); setCustomReason(""); setNotes("");
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {categories.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => { setSelectedCategory(c.id); setSelectedReason(""); }}
            style={[styles.chip, selectedCategory === c.id && { backgroundColor: colors.teal }]}>
            <Text style={[styles.chipText, selectedCategory === c.id && { color: "#fff" }]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedCategory && (
        <><Text style={styles.label}>Reason</Text>
          {reasons.map((r: any) => (
            <TouchableOpacity key={r.id} onPress={() => { setSelectedReason(r.id); setCustomReason(""); }}
              style={[styles.reasonRow, selectedReason === r.id && { backgroundColor: colors.tealLight, borderColor: colors.teal }]}>
              <Text style={styles.reasonText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => { setSelectedReason("_custom"); setCustomReason(""); }}
            style={[styles.reasonRow, selectedReason === "_custom" && { backgroundColor: colors.tealLight, borderColor: colors.teal }]}>
            <Text style={styles.reasonText}>Lainnya (tulis sendiri)</Text>
          </TouchableOpacity>
        </>
      )}

      {selectedReason === "_custom" && <><Text style={styles.label}>Custom Reason</Text><TextInput style={styles.input} value={customReason} onChangeText={setCustomReason} placeholder="Tulis alasan..." /></>}

      <Text style={styles.label}>Start Date</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
      <Text style={styles.label}>End Date</Text>
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, { height: 60 }]} value={notes} onChangeText={setNotes} multiline placeholder="Optional" />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  label: { fontSize: 13, fontWeight: "600", color: colors.grayDark, marginBottom: 4, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, marginRight: 8 },
  chipText: { fontSize: 12, color: colors.grayDark },
  reasonRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 4, backgroundColor: colors.white },
  reasonText: { fontSize: 13 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: colors.white, marginBottom: 8 },
  button: { backgroundColor: colors.teal, padding: 14, borderRadius: 8, alignItems: "center", marginTop: 16 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
