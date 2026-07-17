"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateOvertimeSetting } from "./actions";

export function SettingsForm({ departments, settings }: { departments: any[]; settings: any[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function getSetting(deptId: string) { return settings.find((s: any) => s.department_id === deptId); }

  async function handleSave(deptId: string) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 15) { setMsg("Minimum 15 menit"); return; }
    setMsg(""); startTransition(async () => {
      const r = await updateOvertimeSetting(deptId, num);
      if (r?.success) { setEditId(null); setMsg(""); } else setMsg(r?.error || "Error");
    });
  }

  return (
    <div className="max-w-lg space-y-4">
      {departments.map((dept: any) => {
        const sett = getSetting(dept.id);
        const current = sett?.minimum_overtime_minutes ?? 30;
        const isEditing = editId === dept.id;
        return (
          <Card key={dept.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-sm">{dept.name}</p>
                <p className="text-xs text-muted-foreground">Current: {current} min</p>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input type="number" min={15} value={val} onChange={(e) => setVal(e.target.value)} className="w-20 h-9 text-sm" />
                  <Button size="sm" disabled={isPending} onClick={() => handleSave(dept.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setEditId(dept.id); setVal(String(current)); }}>Edit</Button>
              )}
            </CardContent>
          </Card>
        );
      })}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
