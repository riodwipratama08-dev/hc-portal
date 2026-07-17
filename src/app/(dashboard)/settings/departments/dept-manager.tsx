"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { updateDepartment, createDepartment } from "./actions";

export function DeptManager({ departments }: { departments: any[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleUpdate(id: string) {
    setMsg(""); startTransition(async () => {
      const r = await updateDepartment(id, name);
      if (r?.success) { setEditId(null); } else setMsg(r?.error || "Error");
    });
  }

  async function handleCreate() {
    if (!name.trim()) { setMsg("Name required"); return; }
    setMsg(""); startTransition(async () => {
      const r = await createDepartment(name.trim());
      if (r?.success) { setAddMode(false); setName(""); } else setMsg(r?.error || "Error");
    });
  }

  return (
    <div className="max-w-lg space-y-3">
      {addMode && (
        <Card className="border-primary/30">
          <CardContent className="py-4 space-y-3">
            <Input placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" disabled={isPending} onClick={handleCreate}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddMode(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {departments.map((d: any) => (
        <Card key={d.id}>
          <CardContent className="py-4">
            {editId === d.id ? (
              <div className="space-y-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={isPending} onClick={() => handleUpdate(d.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-sm">{d.name}</p><p className="text-xs text-muted-foreground">{d.code}</p></div>
                <Button size="sm" variant="outline" onClick={() => { setEditId(d.id); setName(d.name); }}>Rename</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {!addMode && <Button variant="outline" size="sm" onClick={() => setAddMode(true)}>+ Add Department</Button>}
      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  );
}
