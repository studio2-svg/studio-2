import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PortalHeader } from "@/components/portal-page";
export default async function Page() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    <>
      <PortalHeader
        eyebrow="Billing"
        title="Invoices"
        description="View and download invoices for studio bookings and equipment rentals."
      />
      <InvoiceTable items={data || []} base="/dashboard/invoices" />
    </>
  );
}
export function InvoiceTable({
  items,
  base,
  showCustomer = false,
}: {
  items: InvoiceItem[];
  base: string;
  showCustomer?: boolean;
}) {
  return (
    <div className="mt-8 overflow-x-auto border border-black/10 bg-paper">
      <table className="w-full min-w-[46rem] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-black/45">
            {showCustomer && <th className="p-4">Customer</th>}
            <th className="p-4">Invoice</th>
            <th className="p-4">Order</th>
            <th className="p-4">Issued</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-black/10 hover:bg-white"
              >
                {showCustomer && (
                  <td className="p-4">
                    {relatedProfile(item.profiles)?.first_name}{" "}
                    {relatedProfile(item.profiles)?.last_name}
                    <br />
                    <small>
                      {relatedProfile(item.profiles)?.email}
                    </small>
                  </td>
                )}
                <td className="p-4 font-mono text-xs">
                  INV-{item.reference.toUpperCase()}
                </td>
                <td className="p-4 capitalize">
                  {item.entity_type.replaceAll("_", " ")}
                </td>
                <td className="p-4">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {item.currency} {(item.amount_minor / 100).toFixed(2)}
                </td>
                <td className="p-4 capitalize">{item.status}</td>
                <td className="p-4 text-right">
                  <Link
                    href={`${base}/${item.id}`}
                    className="border border-ink px-3 py-2 hover:bg-ink hover:text-paper"
                  >
                    View / download
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={showCustomer ? 7 : 6}
                className="p-8 text-center text-black/50"
              >
                No invoices yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
type Profile={first_name:string|null;last_name:string|null;email:string|null};
type InvoiceItem={id:string;reference:string;entity_type:string;created_at:string;currency:string;amount_minor:number;status:string;profiles?:Profile|Profile[]|null};
function relatedProfile(value:Profile|Profile[]|null|undefined){return Array.isArray(value)?value[0]:value}
