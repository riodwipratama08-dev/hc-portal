import { getCurrentEmployee } from "@/lib/auth";

export default async function ShiftsLayout({ children }: { children: React.ReactNode }) {
  try {
    const emp = await getCurrentEmployee();
    if (emp.role !== "admin" && emp.role !== "hr") {
      return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin & HR can access.</div>;
    }
  } catch {
    return <div className="text-center py-12 text-lg text-red-600">Unauthorized — Only Admin & HR can access.</div>;
  }
  return <>{children}</>;
}
