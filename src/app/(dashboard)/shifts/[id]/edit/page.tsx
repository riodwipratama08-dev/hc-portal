import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShiftForm } from "../../shift-form";

export default async function EditShiftPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", id)
    .single();

  if (!shift) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Shift</h1>
      <p className="mb-4 text-sm text-gray-500">Editing: {shift.name}</p>
      <ShiftForm
        defaultValues={{
          id: shift.id,
          name: shift.name,
          start_time: shift.start_time.slice(0, 5),
          end_time: shift.end_time.slice(0, 5),
          applicable_days: shift.applicable_days,
          is_active: shift.is_active,
        }}
      />
    </div>
  );
}
