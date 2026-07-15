import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "./auth/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-white p-6 flex flex-col">
        <h1 className="mb-8 text-xl font-bold">HC Portal</h1>
        <nav className="space-y-1 flex-1">
          {isAdminOrHr && (
            <a
              href="/employees"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Employees
            </a>
          )}
          {isAdminOrHr && (
            <a
              href="/shifts"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Shifts
            </a>
          )}
          {isAdminOrHr && (
            <a
              href="/schedules"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Schedules
            </a>
          )}
          <a
            href="/leaves"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Leaves
          </a>
          <a
            href="/attendance"
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Attendance
          </a>
          {isAdminOrHr && (
            <a
              href="/attendance/import"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Import CSV
            </a>
          )}
          {isAdminOrHr && (
            <a
              href="/leave-balances"
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Leave Balances
            </a>
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
