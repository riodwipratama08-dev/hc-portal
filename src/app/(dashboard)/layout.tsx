import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "./auth/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  let user;
  try {
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    // session error
  }

  if (!user) {
    redirect("/login");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("role, full_name")
    .eq("email", user.email)
    .single();

  const role = employee?.role ?? "employee";
  const fullName = employee?.full_name ?? user.email;

  const isAdminOrHr = role === "admin" || role === "hr";

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r bg-white p-6 flex flex-col overflow-y-auto">
        <h1 className="mb-8 text-xl font-bold">HC Portal</h1>
        <nav className="space-y-1 flex-1">
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Dashboard
          </Link>
          {isAdminOrHr && (
            <Link
              href="/employees"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Employees
            </Link>
          )}
          {isAdminOrHr && (
            <Link
              href="/shifts"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Shifts
            </Link>
          )}
          {isAdminOrHr && (
            <Link
              href="/schedules"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Schedules
            </Link>
          )}
          <Link
            href="/leaves"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Leaves
          </Link>
          <Link
            href="/attendance"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Attendance
          </Link>
          {isAdminOrHr && (
            <Link
              href="/attendance/import"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Import CSV
            </Link>
          )}
          {isAdminOrHr && (
            <Link
              href="/leave-balances"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Leave Balances
            </Link>
          )}
          {isAdminOrHr && (
            <Link
              href="/announcements/manage"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Announcements
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/settings/core-values"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Core Values
            </Link>
          )}
        </nav>
        <div className="pt-8 border-t">
          <p className="text-xs text-gray-500">
            Signed in as <span className="font-medium">{fullName}</span>
          </p>
          <p className="text-xs text-gray-400 capitalize">{role}</p>
          <form action={logout}>
            <button type="submit" className="mt-3 text-xs text-red-500 hover:text-red-700">
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
