"use client";
import Link from "next/link";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import {
  SaveButton,
  TextArea,
  TextField,
} from "@/components/admin-form-fields";
import {
  addStudio,
  deleteStudio,
  saveStudio,
} from "@/app/admin/studio/actions";
type Studio = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  price_minor: number;
  pricing_type: "hourly" | "daily" | "fixed";
  cover_image_url: string | null;
  featured: boolean;
  active: boolean;
};
export function StudiosManager({
  studios,
  selectedId,
}: {
  studios: Studio[];
  selectedId?: string;
}) {
  const [editing, setEditing] = useState<Studio | "new" | null>(null);
  return (
    <>
      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 bg-ink px-4 py-3 text-sm text-paper transition hover:bg-gold hover:text-ink"
        >
          <Plus size={17} /> Add studio
        </button>
      </div>
      <div className="mt-4 overflow-x-auto border border-black/10 bg-paper">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="p-4">Studio</th>
              <th className="p-4">Currency</th>
              <th className="p-4">Price</th>
              <th className="p-4">Timezone</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {studios.map((item) => (
              <tr
                key={item.id}
                className={`border-b border-black/10 transition hover:bg-white ${selectedId === item.id ? "bg-gold/10" : ""}`}
              >
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4">{item.currency}</td>
                <td className="p-4">
                  {item.currency} {(item.price_minor / 100).toFixed(2)} · {item.pricing_type}
                </td>
                <td className="p-4">{item.timezone}</td>
                <td className="p-4">{item.active ? "Active" : "Inactive"}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      aria-label="View"
                      title="View rules and pricing"
                      href={`/admin/studio?studio=${item.id}`}
                      className="grid size-9 place-items-center border border-black/15 transition hover:bg-gold"
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      aria-label="Edit"
                      onClick={() => setEditing(item)}
                      className="grid size-9 place-items-center border border-black/15 transition hover:bg-gold"
                    >
                      <Pencil size={16} />
                    </button>
                    <ActionForm
                      action={deleteStudio}
                      successMessage={`${item.name} deleted.`}
                      className="inline"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        aria-label="Delete"
                        className="grid size-9 place-items-center border border-black/15 text-red-700 transition hover:bg-red-700 hover:text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </ActionForm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-4">
          <section
            role="dialog"
            aria-modal="true"
            className="my-8 w-full max-w-2xl bg-paper p-6"
          >
            <div className="mb-6 flex justify-between">
              <h2 className="font-display text-3xl">
                {editing === "new" ? "Add studio" : `Edit ${editing.name}`}
              </h2>
              <button aria-label="Close" onClick={() => setEditing(null)}>
                <X />
              </button>
            </div>
            <StudioForm studio={editing === "new" ? undefined : editing} />
          </section>
        </div>
      )}
    </>
  );
}
function StudioForm({ studio }: { studio?: Studio }) {
  if (!studio)
    return (
      <ActionForm
        action={addStudio}
        successMessage="Studio created."
        className="grid gap-4 sm:grid-cols-2"
      >
        <TextField name="name" label="Studio name" required />
        <TextField name="slug" label="Slug (optional)" />
        <TextField name="currency" label="Currency" value="GHS" required />
        <TextField
          name="price"
          label="Price"
          type="number"
          value={0}
          required
        />
        <label className="text-sm">
          <span className="mb-2 block">Pricing type</span>
          <select name="pricing_type" defaultValue="hourly" className="w-full border border-black/15 bg-white px-4 py-3">
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-2 block">Studio images</span>
          <input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="w-full border border-black/15 bg-white p-3" />
          <small className="mt-2 block text-black/45">Choose up to 12 images. The first image becomes the cover.</small>
        </label>
        <TextField
          name="timezone"
          label="Timezone"
          value="Africa/Accra"
          required
        />
        <div className="sm:col-span-2">
          <SaveButton label="Create studio" />
        </div>
      </ActionForm>
    );
  return (
    <ActionForm
      action={saveStudio}
      successMessage="Studio details saved."
      className="grid gap-4"
    >
      <input type="hidden" name="id" value={studio.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" value={studio.name} required />
        <TextField name="slug" label="Slug (optional)" value={studio.slug} />
      </div>
      <TextArea
        name="description"
        label="Description"
        value={studio.description}
      />
      <label className="text-sm">
        <span className="mb-2 block">Studio images</span>
        <input
          name="images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="w-full border border-black/15 bg-white p-3"
        />
        <small className="mt-2 block text-black/45">Choose up to 12 images. The first new image becomes the cover; all are added to the client gallery.</small>
      </label>
      <TextArea name="address" label="Address" value={studio.address} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="timezone" label="Timezone" value={studio.timezone} />
        <TextField name="currency" label="Currency" value={studio.currency} />
        <TextField
          name="price"
          label="Price"
          type="number"
          value={studio.price_minor / 100}
        />
        <label className="text-sm">
          <span className="mb-2 block">Pricing type</span>
          <select name="pricing_type" defaultValue={studio.pricing_type || "hourly"} className="w-full border border-black/15 bg-white px-4 py-3">
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
      </div>
      <label className="text-sm">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={studio.featured}
          className="mr-2"
        />
        Featured on homepage
      </label>
      <label className="text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={studio.active}
          className="mr-2"
        />
        Active
      </label>
      <SaveButton />
    </ActionForm>
  );
}
