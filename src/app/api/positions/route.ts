import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: emp } = await supabase.from("employees").select("role").eq("email", user.email).single();
  if (!emp || (emp.role !== "admin" && emp.role !== "hr")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, department_id, level } = await request.json();

  const { data, error } = await supabase.from("positions").insert({
    title, department_id, level: parseInt(level, 10) || 1,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
