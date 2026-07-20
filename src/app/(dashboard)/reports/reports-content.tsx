"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import {
  getAttendanceSummary, getLateRanking, getLeaveReport, getOvertimeReport,
} from "./actions";

function exportCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csv = [headers.join(","), ...data.map((r: any) => headers.map((h) => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsContent({
  departments, role, defaultTab, defaultStart, defaultEnd, defaultDept,
}: {
  departments: any[]; role: string; defaultTab: string; defaultStart: string; defaultEnd: string; defaultDept: string;
}) {
  const [tab, setTab] = useState(defaultTab);
  const [start, setStart] = useState(defaultStart || `${new Date().getFullYear()}-01-01`);
  const [end, setEnd] = useState(defaultEnd || new Date().toISOString().slice(0, 10));
  const [dept, setDept] = useState(defaultDept);
  const [empSearch, setEmpSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isAdminOrExec = role === "admin" || role === "hr" || role === "executive";

  const loadData = useCallback(async () => {
    setLoading(true);
    const f = { startDate: start, endDate: end, departmentId: dept, employeeId: "" };
    try {
      let result: any[];
      if (tab === "attendance") result = await getAttendanceSummary(f);
      else if (tab === "late") result = await getLateRanking(f);
      else if (tab === "leave") result = await getLeaveReport(f);
      else if (tab === "overtime") result = await getOvertimeReport(f);
      else result = [];
      setData(result ?? []);
    } catch { setData([]); }
    setLoading(false);
  }, [tab, start, end, dept]);

  useEffect(() => { loadData(); }, [loadData]);

  const tabs = [
    { key: "attendance", label: "Kehadiran" },
    { key: "late", label: "Keterlambatan" },
    { key: "leave", label: "Cuti / Izin" },
    { key: "overtime", label: "Lembur" },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div><label className="block text-xs font-medium mb-1">Start</label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 w-40" /></div>
        <div><label className="block text-xs font-medium mb-1">End</label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-9 w-40" /></div>
        {isAdminOrExec && (
          <div><label className="block text-xs font-medium mb-1">Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs w-44">
              <option value="">All Departments</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>{loading ? "Loading..." : "Apply"}</Button>
        {data.length > 0 && <Button variant="outline" size="sm" onClick={() => exportCSV(data, `${tab}-report.csv`)}>Export CSV</Button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-sm font-medium pb-1 border-b-2 transition-colors ${tab === t.key ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "attendance" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-xs divide-y">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left">Employee</th><th className="px-3 py-2 text-center">Total</th>
              <th className="px-3 py-2 text-center text-green-700">Hadir</th><th className="px-3 py-2 text-center text-red-700">Tidak Hadir</th>
              <th className="px-3 py-2 text-center text-orange-700">Izin</th><th className="px-3 py-2 text-center text-purple-700">Cuti</th>
              <th className="px-3 py-2 text-center text-gray-500">Libur</th>
              <th className="px-3 py-2 text-center text-yellow-700">Terlambat</th><th className="px-3 py-2 text-center text-yellow-700">Menit</th>
              <th className="px-3 py-2 text-center text-yellow-700">P.Awal</th><th className="px-3 py-2 text-center text-yellow-700">Menit</th>
            </tr></thead>
            <tbody className="divide-y">
              {data.length === 0 && <tr><td colSpan={11} className="text-center py-8 text-muted-foreground">No data.</td></tr>}
              {data.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{r.emp?.full_name}<span className="text-muted-foreground ml-1">{r.emp?.employee_code}</span></td>
                  <td className="px-3 py-2 text-center font-mono">{r.total}</td>
                  <td className="px-3 py-2 text-center font-mono text-green-700">{r.hadir}</td>
                  <td className="px-3 py-2 text-center font-mono text-red-700">{r.tidakHadir}</td>
                  <td className="px-3 py-2 text-center font-mono text-orange-700">{r.izin}</td>
                  <td className="px-3 py-2 text-center font-mono text-purple-700">{r.cuti}</td>
                  <td className="px-3 py-2 text-center font-mono text-gray-500">{r.libur}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.terlambat}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.terlambatMenit}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.pulangAwal}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.pulangAwalMenit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "late" && (
        <div className="space-y-6">
          {data.length > 0 && (
            <Card><CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="emp.full_name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalMinutes" fill="#f59e0b" name="Menit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-xs divide-y">
              <thead className="bg-gray-50"><tr>
                <th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Employee</th>
                <th className="px-3 py-2 text-center">Department</th><th className="px-3 py-2 text-center">Kejadian</th>
                <th className="px-3 py-2 text-center">Total Menit</th>
              </tr></thead>
              <tbody className="divide-y">
                {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No lateness data.</td></tr>}
                {data.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{i + 1}</td>
                    <td className="px-3 py-2">{r.emp?.full_name}<span className="text-muted-foreground ml-1">{r.emp?.employee_code}</span></td>
                    <td className="px-3 py-2 text-center">{r.emp?.departments?.name ?? "-"}</td>
                    <td className="px-3 py-2 text-center font-mono">{r.count}</td>
                    <td className="px-3 py-2 text-center font-mono font-bold">{r.totalMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "leave" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-xs divide-y">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left">Category</th><th className="px-3 py-2 text-center">Total</th>
              <th className="px-3 py-2 text-center text-green-700">Approved</th><th className="px-3 py-2 text-center text-red-700">Rejected</th>
              <th className="px-3 py-2 text-center text-yellow-700">Pending</th>
            </tr></thead>
            <tbody className="divide-y">
              {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No leave data.</td></tr>}
              {data.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{r.category}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.total}</td>
                  <td className="px-3 py-2 text-center font-mono text-green-700">{r.approved}</td>
                  <td className="px-3 py-2 text-center font-mono text-red-700">{r.rejected}</td>
                  <td className="px-3 py-2 text-center font-mono text-yellow-700">{r.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "overtime" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-xs divide-y">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left">Employee</th><th className="px-3 py-2 text-center">Department</th>
              <th className="px-3 py-2 text-center">Kejadian</th><th className="px-3 py-2 text-center">Total Menit</th>
              <th className="px-3 py-2 text-center">Rata-rata</th>
            </tr></thead>
            <tbody className="divide-y">
              {data.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No overtime data.</td></tr>}
              {data.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{r.emp?.full_name}<span className="text-muted-foreground ml-1">{r.emp?.employee_code}</span></td>
                  <td className="px-3 py-2 text-center">{r.emp?.departments?.name ?? "-"}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.count}</td>
                  <td className="px-3 py-2 text-center font-mono font-bold">{r.totalMinutes}</td>
                  <td className="px-3 py-2 text-center font-mono">{r.count > 0 ? Math.round(r.totalMinutes / r.count) : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
