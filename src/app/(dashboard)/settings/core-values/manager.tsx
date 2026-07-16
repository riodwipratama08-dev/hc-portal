"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createCoreValue, updateCoreValue, deleteCoreValue } from "./actions";

export function CoreValueManager({ values }: { values: any[] }) {
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <FormCard key="new" id={null} onClose={() => setEditId(null)} />

      {values.map((v: any) =>
        editId === v.id ? (
          <FormCard key={v.id} id={v.id} defaults={v} onClose={() => setEditId(null)} />
        ) : (
          <Card key={v.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <span className="mr-2 text-lg">{v.icon || "🌟"}</span>
                <span className="font-medium text-sm">{v.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{v.is_active ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditId(v.id)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={async () => { await deleteCoreValue(v.id); window.location.reload(); }}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

function FormCard({ id, defaults, onClose }: { id: string | null; defaults?: any; onClose: () => void }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    if (id) await updateCoreValue(id, fd); else await createCoreValue(fd);
    setPending(false);
    onClose();
    window.location.reload();
  }

  return (
    <Card className="border-primary/30">
      <CardHeader><CardTitle className="text-sm">{id ? "Edit" : "New"} Core Value</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <Input name="title" placeholder="Title" defaultValue={defaults?.title} required />
            <Input name="icon" placeholder="Icon (emoji)" defaultValue={defaults?.icon || "🌟"} maxLength={4} />
            <Input name="display_order" type="number" placeholder="Order" defaultValue={defaults?.display_order ?? 0} />
          </div>
          <Input name="description" placeholder="Description" defaultValue={defaults?.description} required />
          <label className="flex items-center gap-2 text-xs">
            <Checkbox name="is_active" defaultChecked={defaults?.is_active ?? true} /> Active
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving..." : id ? "Update" : "Create"}</Button>
            {id && <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
