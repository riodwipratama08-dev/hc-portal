"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "./actions";

export function AnnouncementManager({ items }: { items: any[] }) {
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <FormCard key="new" id={null} onClose={() => setEditId(null)} />

      {items.map((a: any) =>
        editId === a.id ? (
          <FormCard key={a.id} id={a.id} defaults={a} onClose={() => setEditId(null)} />
        ) : (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {a.is_pinned && <Badge variant="default" className="text-[10px]">Pinned</Badge>}
                  <span className="font-medium text-sm">{a.title}</span>
                  {!a.is_active && <Badge variant="gray" className="text-[10px]">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {a.employees?.full_name} · {new Date(a.published_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditId(a.id)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={async () => { await deleteAnnouncement(a.id); window.location.reload(); }}>Delete</Button>
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
    e.preventDefault(); setPending(true);
    const fd = new FormData(e.currentTarget);
    if (id) await updateAnnouncement(id, fd); else await createAnnouncement(fd);
    setPending(false); onClose(); window.location.reload();
  }

  return (
    <Card className="border-primary/30">
      <CardHeader><CardTitle className="text-sm">{id ? "Edit" : "New"} Announcement</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" placeholder="Title" defaultValue={defaults?.title} required />
          <textarea name="content" placeholder="Content" defaultValue={defaults?.content} required rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox name="is_pinned" defaultChecked={defaults?.is_pinned} /> Pin
            </label>
            {id && (
              <label className="flex items-center gap-2 text-xs">
                <Checkbox name="is_active" defaultChecked={defaults?.is_active ?? true} /> Active
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving..." : id ? "Update" : "Create"}</Button>
            {id && <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
