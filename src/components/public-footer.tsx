import Link from "next/link";
import { getPublicSetting } from "@/lib/cms";
import { SiteLogo } from "@/components/site-logo";

type Footer = { description?: string; address?: string; phone?: string; email?: string; opening_hours?: string; copyright?: string };
export async function PublicFooter() {
  const data = await getPublicSetting<Footer>("footer");
  return <footer className="border-t border-current/15 bg-ink text-paper">
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
      <div><Link href="/" aria-label="Studio 2 home"><SiteLogo tone="gold" large /></Link><p className="mt-5 max-w-sm text-sm leading-6 text-white/50">{data?.description || "Studio details can be published from the administration portal."}</p></div>
      <div className="text-sm leading-7 text-white/60"><p className="mb-2 text-xs uppercase tracking-[.2em] text-gold">Visit</p><p className="whitespace-pre-line">{data?.address || "Address coming soon"}</p><p className="whitespace-pre-line">{data?.opening_hours}</p></div>
      <div className="text-sm leading-7 text-white/60"><p className="mb-2 text-xs uppercase tracking-[.2em] text-gold">Contact</p>{data?.email && <a className="block" href={`mailto:${data.email}`}>{data.email}</a>}{data?.phone && <a className="block" href={`tel:${data.phone}`}>{data.phone}</a>}<Link href="/contact" className="mt-3 block text-gold">Plan a production →</Link></div>
    </div>
    <div className="mx-auto flex max-w-7xl justify-between border-t border-white/10 px-6 py-5 text-xs text-white/35"><span>{data?.copyright || `© ${new Date().getFullYear()} Studio Two`}</span><span>Accra, Ghana</span></div>
  </footer>;
}
