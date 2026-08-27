import { requireAdmin } from "@/lib/auth";
import { CollectionHeader } from "@/components/admin-form-fields";
import { FaqManager } from "@/components/faq-manager";
export default async function FaqAdmin() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (
    <>
      <CollectionHeader
        eyebrow="Website"
        title="FAQs"
        description="Create, order, draft, and publish common questions."
      />
      <FaqManager items={data || []} />
    </>
  );
}
