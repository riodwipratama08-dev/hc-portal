"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createLeaveRequest(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: requester } = await supabase
    .from("employees")
    .select("id, department_id, position_id, positions(level)")
    .eq("email", user.email)
    .single();

  if (!requester) return { error: "Employee record not found." };

  const reasonId = formData.get("reason_id") as string;
  const customLabel = (formData.get("custom_reason_label") as string) || null;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const startTime = (formData.get("start_time") as string) || null;
  const endTime = (formData.get("end_time") as string) || null;
  const notes = (formData.get("additional_notes") as string) || null;

  if (!startDate || !endDate) return { error: "Start and end date are required." };

  const { data: newRequest, error: reqError } = await supabase
    .from("leave_requests")
    .insert({
      employee_id: requester.id,
      reason_id: reasonId || null,
      custom_reason_label: customLabel,
      start_date: startDate,
      end_date: endDate,
      start_time: startTime,
      end_time: endTime,
      additional_notes: notes,
      status: "pending",
    })
    .select()
    .single();

  if (reqError || !newRequest) return { error: reqError?.message ?? "Failed to create request" };

  // Determine approver level 1: highest position.level in same department (excluding self)
  const { data: topInDept } = await supabase
    .from("employees")
    .select("id, full_name, positions!inner(level)")
    .eq("department_id", requester.department_id)
    .eq("status", "active")
    .neq("id", requester.id)
    .order("level", { referencedTable: "positions", ascending: false })
    .order("join_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Level 2: find any HR
  const { data: hrUser } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("role", "hr")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const approvalsToInsert: any[] = [];

  if (topInDept) {
    // Normal flow: level 1 = department supervisor
    approvalsToInsert.push({
      leave_request_id: newRequest.id,
      approver_id: topInDept.id,
      level: 1,
      status: "pending",
    });
    // Level 2 = HR (different person)
    if (hrUser && hrUser.id !== topInDept.id) {
      approvalsToInsert.push({
        leave_request_id: newRequest.id,
        approver_id: hrUser.id,
        level: 2,
        status: "pending",
      });
    }
  } else {
    // Edge case: requester is highest in dept → skip directly to HR
    if (hrUser) {
      approvalsToInsert.push({
        leave_request_id: newRequest.id,
        approver_id: hrUser.id,
        level: 2,
        status: "pending",
      });
    } else {
      // No approvers at all → auto-approve
      await supabase
        .from("leave_requests")
        .update({ status: "approved" })
        .eq("id", newRequest.id);
    }
  }

  if (approvalsToInsert.length > 0) {
    await supabase.from("approvals").insert(approvalsToInsert);
  }

  revalidatePath("/leaves");
  redirect("/leaves");
}

export async function approveLeave(requestId: string, notes?: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: approver } = await supabase
    .from("employees")
    .select("id, role")
    .eq("email", user.email)
    .single();

  if (!approver) return { error: "Not found" };

  const isAdminOrHr = approver.role === "admin" || approver.role === "hr";

  // Admin/HR can approve any pending approval. Other roles only their own assigned records.
  let updQuery = supabase
    .from("approvals")
    .update({ status: "approved", notes: notes || null, acted_at: new Date().toISOString() })
    .eq("leave_request_id", requestId)
    .eq("status", "pending");

  if (!isAdminOrHr) {
    updQuery = updQuery.eq("approver_id", approver.id);
  }

  const { error: updError } = await updQuery;

  if (updError) return { error: updError.message };

  // Check if ALL approval levels are done
  const { data: allApprovals } = await supabase
    .from("approvals")
    .select("status")
    .eq("leave_request_id", requestId);

  const allDone = (allApprovals ?? []).every((a: any) => a.status === "approved");

  if (allDone) {
    await finalizeApproval(supabase, requestId);
  }

  revalidatePath("/leaves");
  return { success: true };
}

export async function rejectLeave(requestId: string, notes?: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: approver } = await supabase
    .from("employees")
    .select("id, role")
    .eq("email", user.email)
    .single();

  if (!approver) return { error: "Not found" };

  const isAdminOrHr = approver.role === "admin" || approver.role === "hr";

  // Admin/HR can reject any pending approval. Others only their own assigned records.
  let rejectQuery = supabase
    .from("approvals")
    .update({ status: "rejected", notes: notes || null, acted_at: new Date().toISOString() })
    .eq("leave_request_id", requestId)
    .eq("status", "pending");

  if (!isAdminOrHr) {
    rejectQuery = rejectQuery.eq("approver_id", approver.id);
  }

  await rejectQuery;

  // Reject any remaining pending approvals
  await supabase
    .from("approvals")
    .update({ status: "rejected" })
    .eq("leave_request_id", requestId)
    .eq("status", "pending");

  // Reject the leave request itself
  await supabase.from("leave_requests").update({ status: "rejected" }).eq("id", requestId);

  revalidatePath("/leaves");
  return { success: true };
}

export async function cancelLeaveRequest(requestId: string) {
  const supabase = createClient();
  await supabase.from("leave_requests").update({ status: "cancelled" }).eq("id", requestId);
  revalidatePath("/leaves");
}

async function finalizeApproval(supabase: ReturnType<typeof createClient>, requestId: string) {
  // Fetch request
  const { data: lr } = await supabase
    .from("leave_requests")
    .select("*, leave_reasons(*, leave_categories(*))")
    .eq("id", requestId)
    .single();

  if (!lr) return;

  // Update request status
  await supabase.from("leave_requests").update({ status: "approved" }).eq("id", requestId);

  const category = lr.leave_reasons?.leave_categories;
  const reasonLabel = lr.custom_reason_label || lr.leave_reasons?.label || "Izin";

  // Update leave_balances if applicable
  if (category?.affects_payroll_or_attendance) {
    const days = dateDiffDays(lr.start_date, lr.end_date);
    const year = new Date(lr.start_date).getFullYear();

    const { data: existing } = await supabase
      .from("leave_balances")
      .select("id, used_days, remaining_days")
      .eq("employee_id", lr.employee_id)
      .eq("leave_category_id", category.id)
      .eq("year", year)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("leave_balances")
        .update({
          used_days: Number(existing.used_days) + days,
          remaining_days: Math.max(0, Number(existing.remaining_days) - days),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("leave_balances").insert({
        employee_id: lr.employee_id,
        leave_category_id: category.id,
        year,
        total_days: 0,
        used_days: days,
        remaining_days: 0,
      });
    }
  }

  // Update attendance: 'tidak_hadir' rows → 'izin' or 'cuti'
  const isCuti = category?.name?.toLowerCase().includes("cuti");
  const attendanceStatus = isCuti ? "cuti" : "izin";

  const { data: matchingAttendance } = await supabase
    .from("attendance")
    .select("id")
    .eq("employee_id", lr.employee_id)
    .gte("attendance_date", lr.start_date)
    .lte("attendance_date", lr.end_date)
    .eq("status", "tidak_hadir");

  if (matchingAttendance && matchingAttendance.length > 0) {
    await supabase
      .from("attendance")
      .update({ status: attendanceStatus, remarks: reasonLabel })
      .in(
        "id",
        matchingAttendance.map((a: any) => a.id)
      );
  }
}

function dateDiffDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

export async function updateLeaveBalance(
  employeeId: string,
  categoryId: string,
  year: number,
  totalDays: number
) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("leave_balances")
    .select("id, total_days, used_days")
    .eq("employee_id", employeeId)
    .eq("leave_category_id", categoryId)
    .eq("year", year)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("leave_balances")
      .update({
        total_days: totalDays,
        remaining_days: totalDays - Number(existing.used_days),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("leave_balances").insert({
      employee_id: employeeId,
      leave_category_id: categoryId,
      year,
      total_days: totalDays,
      used_days: 0,
      remaining_days: totalDays,
    });
  }

  revalidatePath("/leaves");
  revalidatePath("/leave-balances");
  return { success: true };
}
