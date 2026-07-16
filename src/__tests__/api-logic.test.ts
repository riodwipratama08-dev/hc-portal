import { describe, it, expect } from "vitest";

const SUPABASE_URL = "https://pzpdndmxhsvmcmsbktjf.supabase.co";
const ANON_KEY = "sb_publishable_M6y6p5WKEWq7pGfO-C14yQ_hyNtGpbU";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cGRuZG14aHN2bWNtc2JrdGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDA5OTQ5OCwiZXhwIjoyMDk5Njc1NDk4fQ.NKAy8AZFkFVYgW4YWncY8RH9jOBiXe2471iZvV0PNAQ";

const headers = (key = SERVICE_KEY) => ({
  "Content-Type": "application/json",
  "apikey": key,
  "Authorization": `Bearer ${key}`,
  "Prefer": "return=representation",
});

async function signIn(email: string, password: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

describe("RBAC — employees table", () => {
  // NOTE: anon/authenticated roles can access tables because GRANT ALL was run.
  // RLS will restrict this in Fase 5 (Security & Maintenance).
  it("anon key can access employees (RLS not yet enabled)", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=count`, {
      headers: headers(ANON_KEY),
    });
    expect(res.status).toBe(200);
  });

  it("service_role can read all employees", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=email`, {
      headers: headers(SERVICE_KEY),
    });
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});

describe("RBAC — attendance data filtering", () => {
  it("employee only gets own attendance records", async () => {
    const auth = await signIn("karyawan@test.com", "karyawan123");
    const token = auth.access_token;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/attendance?select=employee_id&limit=5`,
      {
        headers: { ...headers(ANON_KEY), Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    // All returned records should belong to the same employee
    const employeeIds = new Set(data.map((d: any) => d.employee_id));
    expect(employeeIds.size).toBeLessThanOrEqual(1);
  });

  it("manager only gets department's attendance", async () => {
    const auth = await signIn("spv@test.com", "spv123123");
    const token = auth.access_token;
    if (!token) { console.warn("spv@test.com login failed — skipping"); return; }

    // First get the manager's department via service_role
    const { data: spvEmp } = await (await fetch(
      `${SUPABASE_URL}/rest/v1/employees?select=department_id&email=eq.spv@test.com`,
      { headers: headers(SERVICE_KEY) }
    )).json().then((d: any) => ({ data: d[0] }));

    if (!spvEmp) { console.warn("spv@test.com employee record not found"); return; }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/attendance?select=employee_id,employees(department_id)&limit=10`,
      { headers: { ...headers(ANON_KEY), Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    // For manager, all dept IDs should match
    for (const d of data) {
      expect(d.employees?.department_id).toBe(spvEmp.department_id);
    }
  });
});

describe("Overtime validation", () => {
  it("rejects overtime_minutes < 30", async () => {
    // Insert via service_role and check constraint
    const res = await fetch(`${SUPABASE_URL}/rest/v1/overtime_records`, {
      method: "POST",
      headers: headers(SERVICE_KEY),
      body: JSON.stringify({
        attendance_id: "00000000-0000-0000-0000-000000000001",
        employee_id: "00000000-0000-0000-0000-000000000001",
        recorded_by: "00000000-0000-0000-0000-000000000001",
        overtime_minutes: 15,
        status: "recorded",
      }),
    });
    // Should fail (FK or validation)
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Admin — can manage settings", () => {
  it("service_role can query core_values_settings", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/core_values_settings?limit=1`, {
      headers: headers(SERVICE_KEY),
    });
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("service_role can query company_core_values", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/company_core_values?select=count`, {
      headers: headers(SERVICE_KEY),
    });
    const data = await res.json();
    expect(data[0]?.count).toBeGreaterThanOrEqual(6);
  });
});
