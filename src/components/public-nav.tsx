import Link from "next/link";
import { getPublicCollection } from "@/lib/cms";
import { PublicMobileMenu } from "@/components/public-mobile-menu";
import { SiteLogo } from "@/components/site-logo";
type NavItem = {
  id: string;
  label: string;
  url: string;
  opens_new_tab: boolean;
};
export async function PublicNav({ dark = false }: { dark?: boolean }) {
  const items = await getPublicCollection<NavItem>("navigation_items");
  const links = items.length
    ? items
    : [
        { id: "about", label: "About", url: "/about", opens_new_tab: false },
        { id: "faq", label: "FAQ", url: "/faq", opens_new_tab: false },
        {
          id: "gallery",
          label: "Gallery",
          url: "/gallery",
          opens_new_tab: false,
        },
      ];
  return (
    <nav
      className={`mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10 ${dark ? "text-paper" : ""}`}
    >
      <Link
        href="/"
        aria-label="Studio 2 home"
      >
        <SiteLogo tone={dark ? "gold" : "black"} />
      </Link>
      <div className="hidden items-center gap-5 text-sm md:flex">
        {links.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            target={item.opens_new_tab ? "_blank" : undefined}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/book" className="border border-gold px-4 py-2 text-gold">
          Book
        </Link>
      </div>
      <PublicMobileMenu links={links} dark={dark} />
    </nav>
  );
}
