"use client";
import { Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import {
  SaveButton,
  StatusField,
  TextArea,
  TextField,
} from "@/components/admin-form-fields";
import { deleteFaq, saveFaq } from "@/app/admin/website/content-actions";
type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  status: string;
};
export function FaqManager({ items }: { items: Faq[] }) {
  const [editing, setEditing] = useState<Faq | "new" | null>(null),
    [viewing, setViewing] = useState<Faq | null>(null);
  return (
    <>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 bg-ink px-4 py-3 text-sm text-paper transition hover:bg-gold hover:text-ink"
        >
          <Plus size={17} /> Add FAQ
        </button>
      </div>
      <div className="mt-4 overflow-x-auto border border-black/10 bg-paper">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="p-4">Question</th>
              <th className="p-4">Category</th>
              <th className="p-4">Order</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-black/10 transition hover:bg-white"
              >
                <td className="max-w-md p-4 font-medium">{item.question}</td>
                <td className="p-4">{item.category}</td>
                <td className="p-4">{item.sort_order}</td>
                <td className="p-4 capitalize">{item.status}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Icon label="View" onClick={() => setViewing(item)}>
                      <Eye size={16} />
                    </Icon>
                    <Icon label="Edit" onClick={() => setEditing(item)}>
                      <Pencil size={16} />
                    </Icon>
                    <ActionForm
                      action={deleteFaq}
                      successMessage="FAQ deleted."
                      className="inline"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        aria-label="Delete FAQ"
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
        {!items.length && (
          <p className="p-6 text-sm text-black/50">
            No FAQs have been added yet.
          </p>
        )}
      </div>
      {editing && (
        <Modal
          title={editing === "new" ? "Add FAQ" : "Edit FAQ"}
          close={() => setEditing(null)}
        >
          <FaqForm item={editing === "new" ? undefined : editing} />
        </Modal>
      )}
      {viewing && (
        <Modal title={viewing.question} close={() => setViewing(null)}>
          <p className="whitespace-pre-line leading-7 text-black/65">
            {viewing.answer}
          </p>
          <p className="mt-6 text-xs uppercase tracking-[.18em] text-gold">
            {viewing.category} · {viewing.status}
          </p>
        </Modal>
      )}
    </>
  );
}
function FaqForm({ item }: { item?: Faq }) {
  return (
    <ActionForm
      action={saveFaq}
      successMessage={item ? "FAQ saved." : "FAQ added."}
      className="grid gap-4"
    >
      <input type="hidden" name="id" value={item?.id || ""} />
      <TextField
        name="question"
        label="Question"
        value={item?.question}
        required
      />
      <TextArea name="answer" label="Answer" rows={6} value={item?.answer} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          name="category"
          label="Category"
          value={item?.category || "General"}
          required
        />
        <TextField
          name="sort_order"
          label="Sort order"
          type="number"
          value={item?.sort_order || 0}
        />
        <StatusField value={item?.status || "draft"} />
      </div>
      <SaveButton label={item ? "Save changes" : "Add FAQ"} />
    </ActionForm>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/55 p-4">
      <section
        role="dialog"
        aria-modal="true"
        className="my-8 w-full max-w-2xl bg-paper p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-6">
          <h2 className="font-display text-3xl">{title}</h2>
          <button type="button" aria-label="Close" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Icon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center border border-black/15 transition hover:bg-gold"
    >
      {children}
    </button>
  );
}
