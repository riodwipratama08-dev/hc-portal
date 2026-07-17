"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { updateOvertimeSetting } from "./actions";

export function SettingsForm({ departments, settings }: { departments: any[]; settings: any[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [minVal, setMinVal] = useState("30");
  const [typeVal, setTypeVal] = useState("per_hari");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function getSetting(deptId: string) { return settings.find((s: any) => s.department_id === deptId); }

  async function handleSave(deptId: string) {
    setMsg(""); startTransition(async () => {
      const r = await updateOvertimeSetting(deptId, parseInt(minVal, 10) || 30, typeVal);
      if (r?.success) { setEditId(null); } else setMsg(r?.error || "Error");
    });
  }

  return (
    <div className="max-w-lg space-y-4">
      {departments.map((dept: any) => {
        const s = getSetting(dept.id);
        const currentType = s?.overtime_type ?? "per_hari";
        const currentMin = s?.minimum_overtime_minutes ?? 30;
        const isEditing = editId === dept.id;
        return (
          <Card key={dept.id}>
            <CardContent className="py-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{dept.name}</p>
                    <div className="flex gap-2">
                      <select value={typeVal} onChange={(e) => setTypeVal(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs">
                        <option value="per_hari">Per Hari</option>
                        <option value="tunjangan_bulanan">Tunjangan Bulanan</option>
                      </select>
                      <Button size="sm" disabled={isPending} onClick={() => handleSave(dept.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                    </div>
                  </div>
                  {typeVal === "per_hari" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Min. Menit:</label>
                      <Input type="number" min={15} value={minVal} onChange={(e) => setMinVal(e.target.value)} className="w-20 h-8 text-sm" />
                    </div>
                  )}
                  {typeVal === "tunjangan_bulanan" && <p className="text-xs text-muted-foreground italic">Tunjangan bulanan — tidak ada deteksi lembur otomatis.</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {currentType === "tunjangan_bulanan" ? "Tunjangan Bulanan" : `${currentMin} min — Per Hari`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setEditId(dept.id); setTypeVal(currentType); setMinVal(String(currentMin)); }}>Edit</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
