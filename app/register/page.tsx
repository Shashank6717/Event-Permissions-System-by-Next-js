import { AuthForm } from "@/components/auth/auth-form";
import { Home } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-emerald-50/30 to-slate-50">
      <header className="border-b bg-white/90 shadow-sm backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-md">
              <Home className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">Event Permission System</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-4 text-center text-sm text-muted-foreground">
            A lighter, clearer way to request and track approvals.
          </div>

          <AuthForm type="register" />
        </div>
      </main>

      <footer className="py-4 border-t text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          (c) {new Date().getFullYear()} Event Permission System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
