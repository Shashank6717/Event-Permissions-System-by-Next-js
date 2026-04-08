import { Sidebar } from "@/components/layout/sidebar";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { UserRole } from "@/types";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get user info
  const { data: user, error } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", session.user.id)
    .single();

  if (
    error ||
    !user ||
    (user.role !== UserRole.FACULTY && user.role !== UserRole.HOD)
  ) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-emerald-50/40 to-slate-50 md:flex-row">
      <Sidebar role={user.role as UserRole} userName={user.name} />
      <main className="min-w-0 flex-1 px-4 py-6 md:p-8">{children}</main>
    </div>
  );
}
