"use client";
import { useActionState } from "react";
import { savePage, type CmsActionState } from "@/app/admin/website/actions";
import type { CmsPage } from "@/lib/cms";
import { NotificationDialog } from "@/components/notification-dialog";
export function CmsPageForm({ page }: { page: CmsPage }) {
  const [state, action, pending] = useActionState<CmsActionState, FormData>(
    savePage,
    {},
  );
  const body = typeof page.content.body === "string" ? page.content.body : "";
  const hero=(page.content.hero||{}) as {background_url?:string;overlay_color?:string;overlay_opacity?:number;text_color?:string};
  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="slug" value={page.slug} />
      <section className="grid gap-5 bg-paper p-6">
        <h2 className="font-display text-2xl">Page content</h2>
        <Field name="title" label="Page title" value={page.title} required />
        <Field name="subtitle" label="Subtitle" value={page.subtitle} />
        <Area name="description" label="Description" value={page.description} />
        <Area name="body" label="Body" value={body} rows={8} />
      </section>
      {page.slug === "home" && <section className="grid gap-5 bg-paper p-6"><h2 className="font-display text-2xl">Homepage hero appearance</h2><p className="text-sm text-black/50">Upload a background image and control the overlay without changing code.</p><input type="hidden" name="heroBackgroundUrl" value={hero.background_url||""}/><label className="text-sm"><span className="mb-2 block">Background image</span><input name="heroBackground" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="w-full border border-black/15 bg-white p-3"/></label><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm"><span className="mb-2 block">Overlay color</span><input name="heroOverlayColor" type="color" defaultValue={hero.overlay_color||"#12110f"} className="h-12 w-full border border-black/15 bg-white p-1"/></label><label className="text-sm"><span className="mb-2 block">Overlay strength: 0–100</span><input name="heroOverlayOpacity" type="number" min="0" max="100" defaultValue={hero.overlay_opacity??65} className="w-full border border-black/15 bg-white px-4 py-3"/></label><label className="text-sm"><span className="mb-2 block">Text color</span><input name="heroTextColor" type="color" defaultValue={hero.text_color||"#f3f0e9"} className="h-12 w-full border border-black/15 bg-white p-1"/></label></div></section>}
      <section className="grid gap-5 bg-paper p-6">
        <h2 className="font-display text-2xl">Search and social</h2>
        <Field name="seoTitle" label="SEO title" value={page.seo_title} />
        <Area
          name="seoDescription"
          label="Meta description"
          value={page.seo_description}
        />
        <Field
          name="canonicalUrl"
          label="Canonical URL"
          value={page.canonical_url}
        />
        <Field name="ogTitle" label="Open Graph title" value={page.og_title} />
        <Area
          name="ogDescription"
          label="Open Graph description"
          value={page.og_description}
        />
        <Field
          name="ogImageUrl"
          label="Open Graph image URL"
          value={page.og_image_url}
        />
        <label className="text-sm">
          <span className="mb-2 block">Robots</span>
          <select
            name="robots"
            defaultValue={page.robots}
            className="w-full border border-black/15 bg-white px-4 py-3"
          >
            <option>index,follow</option>
            <option>noindex,follow</option>
            <option>noindex,nofollow</option>
          </select>
        </label>
      </section>
      {state.error && <NotificationDialog kind="error" message={state.error} />}
      {state.success && <NotificationDialog kind="success" message={state.success} />}
      <div className="flex flex-wrap gap-3">
        <Button value="draft" disabled={pending}>
          Save draft
        </Button>
        <Button value="publish" disabled={pending} primary>
          Publish
        </Button>
        <Button value="archive" disabled={pending}>
          Archive
        </Button>
      </div>
    </form>
  );
}
function Field({
  name,
  label,
  value,
  required,
}: {
  name: string;
  label: string;
  value: string | null;
  required?: boolean;
}) {
  return (
    <label className="text-sm">
      <span className="mb-2 block">{label}</span>
      <input
        name={name}
        defaultValue={value || ""}
        required={required}
        className="w-full border border-black/15 bg-white px-4 py-3"
      />
    </label>
  );
}
function Area({
  name,
  label,
  value,
  rows = 4,
}: {
  name: string;
  label: string;
  value: string | null;
  rows?: number;
}) {
  return (
    <label className="text-sm">
      <span className="mb-2 block">{label}</span>
      <textarea
        name={name}
        defaultValue={value || ""}
        rows={rows}
        className="w-full resize-y border border-black/15 bg-white px-4 py-3"
      />
    </label>
  );
}
function Button({
  value,
  disabled,
  primary,
  children,
}: {
  value: string;
  disabled: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      name="intent"
      value={value}
      disabled={disabled}
      className={
        primary
          ? "bg-ink px-5 py-3 text-sm text-paper"
          : "border border-black/20 px-5 py-3 text-sm"
      }
    >
      {children}
    </button>
  );
}
