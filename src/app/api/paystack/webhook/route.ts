import { createHmac, timingSafeEqual } from "node:crypto";
import { recordSuccessfulPayment, type PaystackTransaction } from "@/lib/record-payment";
import { paystackSecret } from "@/lib/paystack";

export async function POST(request: Request) {
  const body = await request.text();
  const supplied = request.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", paystackSecret()).update(body).digest("hex");
  const valid = supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) return new Response("Invalid signature", { status: 401 });
  const event = JSON.parse(body) as { event?: string; data?: PaystackTransaction & { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    try { await recordSuccessfulPayment(event.data.reference, event.data); }
    catch (error) { console.error("Paystack webhook failed", error); return new Response("Update failed", { status: 500 }); }
  }
  return new Response("OK");
}
