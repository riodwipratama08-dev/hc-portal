"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Position {
  id: string; title: string; level: number; department_id: string;
}

export function PositionCombobox({
  positions, selected, departmentId, onSelect, disabled,
}: {
  positions: Position[]; selected: string; departmentId: string;
  onSelect: (posId: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newLevel, setNewLevel] = useState("1");
  const [creating, setCreating] = useState(false);

  const filtered = positions.filter((p) => {
    if (departmentId && p.department_id !== departmentId) return false;
    return p.title.toLowerCase().includes(search.toLowerCase());
  });

  const selectedPos = positions.find((p) => p.id === selected);

  async function handleCreate() {
    setCreating(true);
    const res = await fetch("/api/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: search, department_id: departmentId, level: parseInt(newLevel, 10) || 1 }),
    });
    const data = await res.json();
    if (data.id) {
      onSelect(data.id);
      setShowCreate(false);
      setOpen(false);
    }
    setCreating(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled}
          className="w-full justify-between h-10">
          {selectedPos ? selectedPos.title : "Select position..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search position..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {search && (
                <button className="w-full px-2 py-3 text-sm text-left flex items-center gap-2 hover:bg-accent"
                  onClick={() => setShowCreate(true)}>
                  <PlusCircle className="h-4 w-4" />
                  + Create position: &ldquo;{search}&rdquo;
                </button>
              )}
              {!search && "No positions found."}
            </CommandEmpty>
            {showCreate && (
              <div className="p-3 border-t space-y-2">
                <Label>Level for &ldquo;{search}&rdquo;</Label>
                <div className="flex gap-2">
                  <Input type="number" min={1} max={4} value={newLevel} onChange={(e) => setNewLevel(e.target.value)} className="h-8 w-20" />
                  <Button size="sm" disabled={creating} onClick={handleCreate}>
                    {creating ? "..." : "Create"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {filtered.length > 0 && (
              <CommandGroup>
                {filtered.map((pos) => (
                  <CommandItem key={pos.id} value={pos.title} onSelect={() => { onSelect(pos.id); setOpen(false); }}>
                    <Check className={cn("mr-2 h-4 w-4", selected === pos.id ? "opacity-100" : "opacity-0")} />
                    {pos.title} <span className="text-xs text-muted-foreground ml-1">(Lv.{pos.level})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
