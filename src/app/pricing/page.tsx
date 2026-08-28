import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { getPublishedPage, getPublicData, pageMetadata } from "@/lib/cms";
type Studio = {
  id: string;
  name: string;
  price_minor: number;
  currency: string;
  active: boolean;
  pricing_type: string;
};
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPublishedPage("pricing"));
}
export default async function PricingPage() {
  const [page, studios] = await Promise.all([
    getPublishedPage("pricing"),
    getPublicData<Studio>("studios"),
  ]);
  return (
    <main className="min-h-screen bg-paper">
      <PublicNav />
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs uppercase tracking-[.28em] text-gold">
          {page?.subtitle}
        </p>
        <h1 className="mt-4 font-display text-7xl">{page?.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-black/55">
          {page?.description}
        </p>
        <div className="mt-14 divide-y divide-black/15">
          {studios.filter(x=>x.active).length ? (
            studios.filter(x=>x.active).map((studio) => (
              <article
                key={studio.id}
                className="flex items-end justify-between py-7"
              >
                <div>
                  <p className="text-xs uppercase tracking-[.18em] text-gold">
                    {studio.pricing_type} studio rate
                  </p>
                  <h2 className="mt-2 font-display text-3xl">{studio.name}</h2>
                </div>
                <p className="font-display text-3xl">
                  {studio.currency} {(studio.price_minor / 100).toFixed(2)}
                </p>
              </article>
            ))
          ) : (
            <p className="py-8 text-black/50">
              Pricing will appear here when configured by Studio Two.
            </p>
          )}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
