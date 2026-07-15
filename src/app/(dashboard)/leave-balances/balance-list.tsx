"use client";

import { useState, useTransition } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateLeaveBalance } from "../leaves/actions";

export function BalanceList({
  employees, categories, balances,
}: {
  employees: any[]; categories: any[]; balances: any[];
}) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editDays, setEditDays] = useState("");
  const [editYear, setEditYear] = useState(new Date().getFullYear().toString());
  const [isPending, startTransition] = useTransition();

  function getBalance(empId: string, catId: string) {
    return balances.find(
      (b: any) => b.employee_id === empId && b.leave_category_id === catId && b.year === parseInt(editYear)
    );
  }

  async function handleSave(empId: string, catId: string) {
    startTransition(async () => {
      const result = await updateLeaveBalance(empId, catId, parseInt(editYear), parseInt(editDays));
      if (result?.success) setEditKey(null);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <label className="text-xs font-medium">Year:</label>
        <select value={editYear} onChange={(e) => setEditYear(e.target.value)}
          className="h-9 rounded-md border border-input px-3 py-1 text-xs">
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs whitespace-nowrap">Employee</TableHead>
              {categories.map((c: any) => (
                <TableHead key={c.id} className="text-xs text-center whitespace-nowrap">{c.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp: any) => (
              <TableRow key={emp.id} className="text-xs">
                <TableCell className="whitespace-nowrap font-medium">
                  {emp.full_name}
                  <div className="text-muted-foreground">{emp.employee_code}</div>
                </TableCell>
                {categories.map((cat: any) => {
                  const bal = getBalance(emp.id, cat.id);
                  const key = `${emp.id}_${cat.id}`;
                  return (
                    <TableCell key={cat.id} className="text-center">
                      {editKey === key ? (
                        <div className="flex items-center gap-1 justify-center">
                          <Input type="number" min={0} value={editDays}
                            onChange={(e) => setEditDays(e.target.value)}
                            className="w-16 h-8 text-xs text-center" />
                          <Button size="sm" disabled={isPending} onClick={() => handleSave(emp.id, cat.id)}>OK</Button>
                        </div>
                      ) : bal ? (
                        <div className="cursor-pointer" onClick={() => { setEditKey(key); setEditDays(String(bal.total_days)); }}>
                          <span className="font-medium">{String(bal.remaining_days)}</span>
                          <span className="text-muted-foreground"> / {String(bal.total_days)}</span>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs h-7"
                          onClick={() => { setEditKey(key); setEditDays("12"); }}>
                          Set
                        </Button>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
