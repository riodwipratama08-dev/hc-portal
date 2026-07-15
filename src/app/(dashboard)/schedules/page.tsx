import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const supabase = createClient();

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*, schedule_shifts(id, shift_id)")
    .order("name");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <Button asChild>
          <a href="/schedules/new">+ Add Schedule</a>
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Shifts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(schedules ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No schedules defined.
                </TableCell>
              </TableRow>
            )}
            {(schedules ?? []).map((sched: any) => (
              <TableRow key={sched.id}>
                <TableCell className="font-medium">{sched.name}</TableCell>
                <TableCell>{sched.schedule_shifts?.length ?? 0} shift(s)</TableCell>
                <TableCell>
                  <Badge variant={sched.is_active ? "success" : "gray"}>
                    {sched.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" asChild>
                      <a href={`/schedules/${sched.id}/assign`}>Assign</a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/schedules/${sched.id}/edit`}>Edit</a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
