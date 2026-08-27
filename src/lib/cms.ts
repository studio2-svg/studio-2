import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  content: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  robots: string;
  published_at: string | null;
  updated_at: string;
};

export async function getPublishedPage(slug: string): Promise<CmsPage | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Unable to load CMS page: ${error.message}`);
  return data as CmsPage | null;
}

export async function getPublicCollection<T>(
  table: "faqs" | "testimonials" | "gallery_items" | "navigation_items",
): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
  let query = supabase
    .from(table)
    .select("*")
    .eq("status", "published")
    .order("sort_order");
  if (table === "navigation_items") query = query.eq("is_visible", true);
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load ${table}: ${error.message}`);
  return (data || []) as T[];
}

export async function getPublicEquipment<T>(): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("equipment")
    .select("*,equipment_categories(name)")
    .eq("status", "available")
    .order("featured", { ascending: false })
    .order("name");
  if (error) throw new Error(`Unable to load equipment: ${error.message}`);
  return (data || []) as T[];
}

export async function getPublicStaff<T>(): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("staff_members")
    .select("*,staff_categories(name)")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("name");
  if (error) throw new Error(`Unable to load team: ${error.message}`);
  return (data || []) as T[];
}

export async function getPublicData<T>(
  table: "services" | "studios" | "opening_hours",
): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`Unable to load ${table}: ${error.message}`);
  return (data || []) as T[];
}
export async function getPublicSetting<T>(keyName: string): Promise<T | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", keyName)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Unable to load setting: ${error.message}`);
  return (data?.value || null) as T | null;
}

export function pageMetadata(page: CmsPage | null) {
  if (!page) return {};
  const robots = page.robots.toLowerCase();
  return {
    title: page.seo_title || page.title,
    description: page.seo_description || page.description || undefined,
    alternates: page.canonical_url
      ? { canonical: page.canonical_url }
      : undefined,
    robots: {
      index: !robots.includes("noindex"),
      follow: !robots.includes("nofollow"),
    },
    openGraph: {
      title: page.og_title || page.seo_title || page.title,
      description:
        page.og_description ||
        page.seo_description ||
        page.description ||
        undefined,
      images: page.og_image_url ? [page.og_image_url] : undefined,
    },
  };
}
