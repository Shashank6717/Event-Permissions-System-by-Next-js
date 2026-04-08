"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/types";
import { LogOut, User, FilePlus, FileText, Home, Menu, X } from "lucide-react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItemClass = (path: string) =>
    cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
      isActive(path)
        ? "bg-white/10 text-white shadow-sm"
        : "text-slate-200 hover:bg-white/10 hover:text-white"
    );

  return (
    <div className="md:min-h-screen md:w-72">
      <div className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Event Permissions
              </p>
              <p className="text-xs text-slate-500">{userName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 -translate-x-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none",
          open && "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col px-5 py-6">
          <div className="flex items-center justify-between md:mb-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Event Permissions</h1>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                  <User size={14} />
                  <span className="font-medium">{userName}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/80 transition hover:bg-white/10 md:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-8 space-y-1">
            {role === UserRole.STUDENT ? (
              <>
                <Link
                  href="/student/dashboard"
                  className={navItemClass("/student/dashboard")}
                  onClick={() => setOpen(false)}
                >
                  <Home size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/student/new-request"
                  className={navItemClass("/student/new-request")}
                  onClick={() => setOpen(false)}
                >
                  <FilePlus size={18} />
                  <span>New Request</span>
                </Link>
                <Link
                  href="/student/my-requests"
                  className={navItemClass("/student/my-requests")}
                  onClick={() => setOpen(false)}
                >
                  <FileText size={18} />
                  <span>My Requests</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/faculty/dashboard"
                  className={navItemClass("/faculty/dashboard")}
                  onClick={() => setOpen(false)}
                >
                  <Home size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/faculty/requests"
                  className={navItemClass("/faculty/requests")}
                  onClick={() => setOpen(false)}
                >
                  <FileText size={18} />
                  <span>Pending Requests</span>
                </Link>
                <Link
                  href="/faculty/history"
                  className={navItemClass("/faculty/history")}
                  onClick={() => setOpen(false)}
                >
                  <FileText size={18} />
                  <span>Request History</span>
                </Link>
              </>
            )}
          </nav>

          <div className="mt-auto pt-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
