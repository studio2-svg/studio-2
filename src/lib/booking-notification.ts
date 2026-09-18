import { createAdminClient } from "@/lib/supabase/admin";

type BookingNotification = {
  bookingId: string;
  customerId: string;
  studioName: string;
  productionType: string;
  startsAt: Date;
  endsAt: Date;
  currency: string;
  totalMinor: number;
};

const primaryRecipient = "info@studio2ghana.com";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ]!,
  );
}

function formatMoney(currency: string, amountMinor: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(value);
}

export async function sendBookingNotification(input: BookingNotification) {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_KEY;
  if (!apiKey) {
    console.warn("Booking notification skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const admin = createAdminClient();
  const [{ data: portalUsers }, { data: customer }] = await Promise.all([
    admin
      .from("profiles")
      .select("email")
      .in("role", ["staff", "manager", "admin", "owner"]),
    admin
      .from("profiles")
      .select("first_name,last_name,email,phone,company_name")
      .eq("id", input.customerId)
      .maybeSingle(),
  ]);

  const bcc = Array.from(
    new Set(
      (portalUsers || [])
        .map((profile) => profile.email?.trim().toLowerCase())
        .filter(
          (email): email is string =>
            Boolean(email) && email !== primaryRecipient,
        ),
    ),
  );
  const customerName =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
    "Studio 2 customer";
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://studio2ghana.com"
  ).replace(/\/$/, "");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.BOOKING_NOTIFICATION_FROM ||
        "Studio 2 Bookings <bookings@studio2ghana.com>",
      to: [primaryRecipient],
      ...(bcc.length ? { bcc } : {}),
      subject: `New booking: ${input.studioName} — ${customerName}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#111;line-height:1.55;max-width:640px;margin:auto">
          <p style="font-size:12px;letter-spacing:3px;color:#b38a45;text-transform:uppercase">Studio 2</p>
          <h1 style="font-family:Georgia,serif;font-weight:400">A new studio booking was placed</h1>
          <p>The booking has been created and is awaiting payment confirmation.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:10px;border-bottom:1px solid #ddd;color:#666">Customer</td><td style="padding:10px;border-bottom:1px solid #ddd"><strong>${escapeHtml(customerName)}</strong><br>${escapeHtml(customer?.email || "No email supplied")}${customer?.phone ? `<br>${escapeHtml(customer.phone)}` : ""}${customer?.company_name ? `<br>${escapeHtml(customer.company_name)}` : ""}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #ddd;color:#666">Studio</td><td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(input.studioName)}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #ddd;color:#666">Production type</td><td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(input.productionType)}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #ddd;color:#666">Starts</td><td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(input.startsAt))}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #ddd;color:#666">Ends</td><td style="padding:10px;border-bottom:1px solid #ddd">${escapeHtml(formatDate(input.endsAt))}</td></tr>
            <tr><td style="padding:10px;border-bottom:1px solid #ddd;color:#666">Total</td><td style="padding:10px;border-bottom:1px solid #ddd"><strong>${escapeHtml(formatMoney(input.currency, input.totalMinor))}</strong></td></tr>
            <tr><td style="padding:10px;color:#666">Booking reference</td><td style="padding:10px">${escapeHtml(input.bookingId)}</td></tr>
          </table>
          <a href="${siteUrl}/admin/bookings" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 22px">View booking</a>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Booking notification failed (${response.status}): ${await response.text()}`,
    );
  }
}
