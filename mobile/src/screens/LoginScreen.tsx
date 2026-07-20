import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert("Error", "Email and password required"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("Login Failed", error.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HC Portal</Text>
      <Text style={styles.subtitle}>Sign In</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 4, color: colors.teal },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 32, color: colors.gray },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: colors.teal, padding: 14, borderRadius: 8, alignItems: "center" },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
});
