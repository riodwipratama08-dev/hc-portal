"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCoreValuesSettings } from "./actions";

export function HeroSettingsForm({ defaults }: { defaults: any }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await updateCoreValuesSettings(fd);
      if (r?.error) setMsg(r.error); else setMsg("Saved ✓");
      setTimeout(() => setMsg(""), 2000);
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Hero Settings</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" name="company_name" defaultValue={defaults?.company_name || "Malilkids"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_title">Hero Title</Label>
              <Input id="hero_title" name="hero_title" defaultValue={defaults?.hero_title || "CORE VALUE MALILKIDS"} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero_description">Hero Description</Label>
            <textarea
              id="hero_description" name="hero_description" rows={3} defaultValue={defaults?.hero_description || ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner_image_url">Banner Image URL</Label>
            <Input id="banner_image_url" name="banner_image_url" placeholder="https://images.unsplash.com/..." defaultValue={defaults?.banner_image_url || ""} />
            {defaults?.banner_image_url && (
              <img src={defaults.banner_image_url} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving..." : "Save Settings"}</Button>
            {msg && <span className="text-xs text-green-600">{msg}</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
