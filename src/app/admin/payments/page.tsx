import { requireAdmin } from "@/lib/auth";
import { PortalHeader } from "@/components/portal-page";
function related<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] : value; }
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("payments").select("*,profiles(first_name,last_name,email)").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return <><PortalHeader eyebrow="Finance" title="Payments" description="Track pending, paid, failed, refunded, and manually recorded transactions."/>
    <div className="mt-8 overflow-x-auto bg-paper"><table className="w-full min-w-[52rem] text-left text-sm"><thead><tr className="border-b border-black/10 text-black/45"><th className="p-4">Customer</th><th className="p-4">Reference</th><th className="p-4">Order</th><th className="p-4">Amount</th><th className="p-4">Date</th><th className="p-4">Status</th></tr></thead><tbody>
      {data?.length ? data.map(item => { const customer = related(item.profiles); return <tr key={item.id} className="border-b border-black/10 hover:bg-white"><td className="p-4"><strong>{customer?.first_name} {customer?.last_name}</strong><small className="block text-black/45">{customer?.email}</small></td><td className="p-4 font-mono text-xs">{item.reference}</td><td className="p-4 capitalize">{item.entity_type.replaceAll("_", " ")}</td><td className="p-4">{item.currency} {(item.amount_minor / 100).toFixed(2)}</td><td className="p-4">{new Date(item.created_at).toLocaleString()}</td><td className="p-4 capitalize">{item.status}</td></tr>; }) : <tr><td colSpan={6} className="p-8 text-center text-black/50">No payment records yet.</td></tr>}
    </tbody></table></div></>;
}
