import { createClient } from "@/lib/supabase/server";
import { Shift } from "@/lib/types";
import { ShiftList } from "./shift-list";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const supabase = createClient();

  const { data: shifts } = await supabase
    .from("shifts")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shifts</h1>
        <a
          href="/shifts/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add Shift
        </a>
      </div>

      <ShiftList shifts={(shifts ?? []) as Shift[]} />
    </div>
  );
}
