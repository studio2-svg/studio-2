import { requireAdmin } from "@/lib/auth";
import { PortalHeader } from "@/components/portal-page";
import { ActionForm } from "@/components/action-form";
import { SaveButton, TextField } from "@/components/admin-form-fields";
import { updateBookingOrder } from "@/app/admin/orders-actions";
function related<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}
export default async function Page() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id,starts_at,ends_at,status,estimated_amount_minor,studios(name,currency),profiles(first_name,last_name,email),booking_purposes(name)",
    )
    .order("starts_at", { ascending: false });
  if (error) throw new Error(error.message);
  const { data: payments } = await supabase
    .from("payments")
    .select("entity_id,status")
    .eq("entity_type", "booking");
  return (
    <>
      <PortalHeader
        eyebrow="Operations"
        title="Bookings"
        description="Review studio booking requests submitted by clients."
      />
      <div className="mt-8 overflow-x-auto border border-black/10 bg-paper">
        <table className="w-full min-w-[54rem] text-left text-sm">
          <thead className="border-b border-black/10 text-black/45">
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Studio</th>
              <th className="p-4">Date and time</th>
              <th className="p-4">Purpose</th>
              <th className="p-4">Estimate</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.length ? (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-black/10 transition hover:bg-white"
                >
                  <td className="p-4">
                    <strong>
                      {related(item.profiles)?.first_name}{" "}
                      {related(item.profiles)?.last_name}
                    </strong>
                    <br />
                    <span className="text-black/45">
                      {related(item.profiles)?.email}
                    </span>
                  </td>
                  <td className="p-4">{related(item.studios)?.name}</td>
                  <td className="p-4">
                    {new Date(item.starts_at).toLocaleString()}
                    <br />
                    <span className="text-black/45">
                      to {new Date(item.ends_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                    {related(item.booking_purposes)?.name || "General"}
                  </td>
                  <td className="p-4">
                    {related(item.studios)?.currency}{" "}
                    {(item.estimated_amount_minor / 100).toFixed(2)}
                  </td>
                  <td className="p-4 capitalize">{item.status}</td>
                  <td className="p-4 text-right">
                    <details className="relative inline-block text-left">
                      <summary className="cursor-pointer list-none border border-ink px-3 py-2">
                        Edit
                      </summary>
                      <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4">
                        <div className="my-8 w-full max-w-lg bg-paper p-6 text-left shadow-2xl">
                        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-3xl">Edit booking</h2><a href="/admin/bookings" className="border border-black/15 px-3 py-2 text-sm">Close</a></div>
                        <ActionForm
                          action={updateBookingOrder}
                          successMessage="Booking updated."
                          className="grid gap-3"
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <TextField
                            name="starts_at"
                            label="Starts"
                            type="datetime-local"
                            value={new Date(item.starts_at)
                              .toISOString()
                              .slice(0, 16)}
                            required
                          />
                          <TextField
                            name="ends_at"
                            label="Ends"
                            type="datetime-local"
                            value={new Date(item.ends_at)
                              .toISOString()
                              .slice(0, 16)}
                            required
                          />
                          <Select
                            name="status"
                            label="Booking status"
                            value={item.status}
                            options={[
                              "pending",
                              "confirmed",
                              "cancelled",
                              "completed",
                            ]}
                          />
                          <Select
                            name="payment_status"
                            label="Payment status"
                            value={
                              payments?.find((p) => p.entity_id === item.id)
                                ?.status || "pending"
                            }
                            options={["pending", "paid", "failed", "refunded"]}
                          />
                          <SaveButton label="Save booking" />
                        </ActionForm>
                        </div>
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-black/50">
                  No booking requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <label className="text-sm">
      <span className="mb-2 block">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="w-full border border-black/15 bg-white p-3"
      >
        {options.map((x) => (
          <option key={x} value={x}>
            {x.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
