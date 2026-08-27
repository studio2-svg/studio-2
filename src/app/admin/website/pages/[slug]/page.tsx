import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsPageForm } from "@/components/cms-page-form";
import { requireAdmin } from "@/lib/auth";
import type { CmsPage } from "@/lib/cms";
import { restorePageVersion } from "../../actions";
import { ActionForm } from "@/components/action-form";
export default async function EditPage({
  params,
}: PageProps<"/admin/website/pages/[slug]">) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();
  const { data: page } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) notFound();
  const { data: versions } = await supabase
    .from("content_versions")
    .select("id,version_number,changed_at")
    .eq("entity_type", "cms_page")
    .eq("entity_id", page.id)
    .order("version_number", { ascending: false })
    .limit(10);
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_18rem]">
      <div>
        <Link href="/admin/website" className="text-sm text-black/50">
          ← Website
        </Link>
        <p className="mt-7 text-xs uppercase tracking-[.22em] text-gold">
          Page editor · /{slug}
        </p>
        <h1 className="mt-2 mb-8 font-display text-5xl">{page.title}</h1>
        <CmsPageForm page={page as CmsPage} />
      </div>
      <aside className="xl:pt-28">
        <div className="bg-paper p-5">
          <h2 className="font-display text-xl">Version history</h2>
          <div className="mt-4 space-y-3">
            {versions?.map((version) => (
              <ActionForm
                action={restorePageVersion}
                successMessage={`Version ${version.version_number} restored.`}
                key={version.id}
                className="flex items-center justify-between border-t border-black/10 pt-3"
              >
                <input type="hidden" name="id" value={page.id} />
                <input type="hidden" name="slug" value={slug} />
                <input
                  type="hidden"
                  name="version"
                  value={version.version_number}
                />
                <span className="text-xs text-black/50">
                  v{version.version_number}
                  <br />
                  {new Date(version.changed_at).toLocaleDateString()}
                </span>
                <button className="text-xs underline">Restore</button>
              </ActionForm>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
