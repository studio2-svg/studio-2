import { requireAdmin } from "@/lib/auth";
import { PortalHeader } from "@/components/portal-page";
import { InvoiceTable } from "@/app/dashboard/invoices/page";
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("payments")
    .select("*,profiles(first_name,last_name,email)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    <>
      <PortalHeader
        eyebrow="Finance"
        title="Invoices"
        description="View and download every pending, paid, failed, or refunded invoice."
      />
      <InvoiceTable items={data || []} base="/admin/invoices" showCustomer />
    </>
  );
}
