import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PortalHeader } from "@/components/portal-page";
function related<T>(value:T|T[]|null){return Array.isArray(value)?value[0]:value}
export default async function Page() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,starts_at,ends_at,status,estimated_amount_minor,studios(name,currency),booking_purposes(name)",
    )
    .eq("customer_id", user.id)
    .order("starts_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PortalHeader
          eyebrow="Your account"
          title="Bookings"
          description="View upcoming and previous studio bookings."
        />
        <Link
          href="/book"
          className="bg-ink px-5 py-3 text-sm text-paper transition hover:bg-gold hover:text-ink"
        >
          Start a booking
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto border border-black/10 bg-paper">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="p-4">Studio</th>
              <th className="p-4">Date and time</th>
              <th className="p-4">Purpose</th>
              <th className="p-4">Estimate</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.length ? (
            data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-black/10 transition hover:bg-white"
                >
              <td className="p-4 font-medium">{related(item.studios)?.name}</td>
                  <td className="p-4">
                    {new Date(item.starts_at).toLocaleString()}
                    <br />
                    <span className="text-black/45">
                      to {new Date(item.ends_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                {related(item.booking_purposes)?.name || "General production"}
                  </td>
                  <td className="p-4">
                {related(item.studios)?.currency}{" "}
                    {(item.estimated_amount_minor / 100).toFixed(2)}
                  </td>
                  <td className="p-4 capitalize">{item.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-black/50">
                  No bookings yet. Start your first booking above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
