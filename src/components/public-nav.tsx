import Link from "next/link";
import { getPublicCollection } from "@/lib/cms";
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
        prefetch={false}
        href="/"
        className="font-display text-xl font-semibold tracking-[.18em]"
      >
        STUDIO TWO
      </Link>
      <div className="flex items-center gap-5 text-sm">
        {links.map((item) => (
          <Link
            prefetch={false}
            key={item.id}
            href={item.url}
            target={item.opens_new_tab ? "_blank" : undefined}
          >
            {item.label}
          </Link>
        ))}
        <Link prefetch={false} href="/book" className="border border-gold px-4 py-2 text-gold">
          Book
        </Link>
      </div>
    </nav>
  );
}
