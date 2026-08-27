"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, Menu, X } from "lucide-react";
import { useState } from "react";
import { logout } from "@/app/(auth)/actions";

export function PortalShell({ title, nav, children }: { title: string; nav: { href: string; label: string }[]; children: React.ReactNode }) {
  const pathname=usePathname(),[open,setOpen]=useState(false);
  const root=pathname.startsWith("/admin")?"/admin":"/dashboard";
  const isRoot=pathname===root;
  const segments=pathname.split("/").filter(Boolean);
  const backHref=segments.length>2?`/${segments.slice(0,-1).join("/")}`:root;
  const navigation=<><p className="mb-6 text-xs uppercase tracking-[.22em] text-black/45">{title}</p><nav className="space-y-1">{nav.map(item=><Link onClick={()=>setOpen(false)} key={item.href} href={item.href} className={`block border-l px-4 py-2.5 text-sm ${pathname===item.href?"border-gold bg-white":"border-black/15 hover:border-gold hover:bg-white/50"}`}>{item.label}</Link>)}</nav></>;
  return <div className="min-h-screen bg-[#ebe7de]"><header className="sticky top-0 z-30 border-b border-black/10 bg-paper"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><button type="button" onClick={()=>setOpen(true)} aria-label="Open navigation" className="grid size-10 place-items-center border border-black/15 md:hidden"><Menu size={20}/></button><Link href="/" className="font-display text-xl tracking-[.18em]">STUDIO TWO</Link></div><form action={logout}><button className="text-sm text-black/60">Sign out</button></form></div></header>{open&&<div className="fixed inset-0 z-50 md:hidden"><button type="button" aria-label="Close navigation" onClick={()=>setOpen(false)} className="absolute inset-0 bg-black/45"/><aside className="relative h-full w-[min(19rem,86vw)] overflow-y-auto bg-paper px-6 py-6 shadow-2xl"><div className="mb-10 flex items-center justify-between"><span className="font-display text-lg tracking-[.16em]">STUDIO TWO</span><button type="button" aria-label="Close navigation" onClick={()=>setOpen(false)} className="grid size-10 place-items-center border border-black/15"><X size={20}/></button></div>{navigation}</aside></div>}<div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[13rem_1fr] md:py-10"><aside className="hidden md:block">{navigation}</aside><main className="min-w-0">{!isRoot&&<Link href={backHref} className="mb-6 inline-flex items-center gap-1 text-sm text-black/50 hover:text-ink"><ChevronLeft size={16}/> Back</Link>}{children}</main></div></div>;
}
