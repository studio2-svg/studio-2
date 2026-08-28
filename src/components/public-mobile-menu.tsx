"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SiteLogo } from "@/components/site-logo";

type LinkItem = { id: string; label: string; url: string; opens_new_tab: boolean };
export function PublicMobileMenu({ links, dark }: { links: LinkItem[]; dark: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="md:hidden">
    <button type="button" aria-label="Open navigation" onClick={() => setOpen(true)} className={`grid size-10 place-items-center border ${dark ? "border-white/30" : "border-black/20"}`}><Menu size={21}/></button>
    {open && <div className="fixed inset-0 z-[100]">
      <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/55" />
      <aside className="relative ml-auto flex h-full w-[min(20rem,86vw)] flex-col bg-paper p-6 text-ink shadow-2xl">
        <div className="flex items-center justify-between"><SiteLogo/><button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="grid size-10 place-items-center border border-black/15"><X size={20}/></button></div>
        <nav className="mt-12 grid gap-1">{links.map(item => <Link key={item.id} href={item.url} target={item.opens_new_tab ? "_blank" : undefined} onClick={() => setOpen(false)} className="border-b border-black/10 px-2 py-4 text-lg">{item.label}</Link>)}</nav>
        <Link href="/book" onClick={() => setOpen(false)} className="mt-8 bg-ink px-5 py-4 text-center text-sm uppercase tracking-[.16em] text-paper">Book a studio</Link>
      </aside>
    </div>}
  </div>;
}
