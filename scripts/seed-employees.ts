/**
 * SEEDER: Seed employees dari file CSV
 *
 * Usage:
 *   npm run seed:employees [path/to/file.csv]
 *
 * Default path: seed-data/employees-template.csv
 *
 * Kolom CSV: nip, full_name, department, position_title, position_level, system_role, email (opsional)
 *
 * Script IDEMPOTENT — bisa dijalankan ulang tanpa duplikat:
 *   - Departemen di-upsert by name
 *   - Position dicek existence dulu (department_id + title)
 *   - Employee di-upsert by employee_code (nip)
 *   - Auth user dibuat jika belum ada (ignore error jika sudah ada)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found.");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key && value) process.env[key] = value;
  }
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });
    if (row.nip) rows.push(row);
  }
  return rows;
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY must be in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const csvPath = process.argv[2] || path.resolve(__dirname, "..", "seed-data", "employees-template.csv");
  if (!fs.existsSync(csvPath)) { console.error(`Not found: ${csvPath}`); process.exit(1); }

  console.log(`Reading: ${csvPath}`);
  const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
  console.log(`Found ${rows.length} rows\n`);

  const VALID_ROLES = ["admin", "hr", "manager", "employee"];
  const invalid = rows.filter((r) => !VALID_ROLES.includes(r.system_role));
  if (invalid.length > 0) {
    console.error("Invalid system_role:", invalid.map((r) => `${r.nip}:${r.system_role}`));
    process.exit(1);
  }

  let createdDept = 0, createdPos = 0, createdEmp = 0, createdAuth = 0;

  const deptCache: Record<string, string> = {};
  const posCache: Record<string, string> = {};

  for (const row of rows) {
    // --- Department ---
    const deptName = row.department;
    if (!deptCache[deptName]) {
      const { data } = await supabase.from("departments").select("id").eq("name", deptName).maybeSingle();
      if (data) {
        deptCache[deptName] = data.id;
      } else {
        const { data: newDept } = await supabase.from("departments")
          .insert({ name: deptName, code: deptName.substring(0, 3).toUpperCase() }).select("id").single();
        if (newDept) { deptCache[deptName] = newDept.id; createdDept++; }
      }
    }

    // --- Position ---
    const posTitle = row.position_title;
    const posKey = `${deptCache[deptName]}_${posTitle}`;
    if (!deptCache[deptName]) { console.log(`  SKIP ${row.nip}: dept not found`); continue; }

    if (!posCache[posKey]) {
      const { data } = await supabase.from("positions")
        .select("id").eq("department_id", deptCache[deptName]).eq("title", posTitle).maybeSingle();
      if (data) {
        posCache[posKey] = data.id;
      } else {
        const { data: newPos } = await supabase.from("positions")
          .insert({ title: posTitle, department_id: deptCache[deptName], level: parseInt(row.position_level) || 1 })
          .select("id").single();
        if (newPos) { posCache[posKey] = newPos.id; createdPos++; }
      }
    }
    if (!posCache[posKey]) { console.log(`  SKIP ${row.nip}: pos not found`); continue; }

    // --- Employee ---
    const email = row.email || `${row.nip}@malilkids.internal`;
    const { error: empErr } = await supabase.from("employees").upsert({
      employee_code: row.nip, full_name: row.full_name, email,
      phone: "-", department_id: deptCache[deptName], position_id: posCache[posKey],
      join_date: new Date().toISOString().slice(0, 10), status: "active", role: row.system_role,
    }, { onConflict: "employee_code" });

    if (empErr) { console.error(`  FAIL ${row.nip}: ${empErr.message}`); continue; }
    createdEmp++;

    // --- Auth user ---
    const { error: authErr } = await supabase.auth.admin.createUser({
      email, password: "Malilkids123!", email_confirm: true,
    });
    if (authErr && !authErr.message.includes("already been registered")) {
      console.warn(`  WARN auth ${email}: ${authErr.message}`);
    } else {
      createdAuth++;
    }

    console.log(`  OK ${row.nip} | ${row.full_name} | ${email}`);
  }

  console.log(`\n--- DONE ---`);
  console.log(`Departments: ${createdDept} new`);
  console.log(`Positions:   ${createdPos} new`);
  console.log(`Employees:   ${createdEmp} upserted`);
  console.log(`Auth users:  ${createdAuth} created`);
}

main().catch(console.error);
