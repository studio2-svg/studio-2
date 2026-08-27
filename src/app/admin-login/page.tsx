import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return <main className="grid min-h-screen place-items-center bg-ink px-6 py-16 text-white">
    <section className="w-full max-w-md">
      <Link href="/" className="font-display text-2xl tracking-wide">STUDIO TWO</Link>
      <p className="mt-16 text-xs uppercase tracking-[.25em] text-gold">Administration portal</p>
      <h1 className="mt-3 font-display text-5xl">Welcome back.</h1>
      <p className="mt-4 text-sm leading-6 text-white/55">For Studio Two administrators only. Accounts are created securely by the portal owner.</p>
      <AdminLoginForm />
      <Link href="/login" className="mt-8 block text-center text-sm text-white/55 underline decoration-white/30 underline-offset-4">Client sign in</Link>
    </section>
  </main>;
}
