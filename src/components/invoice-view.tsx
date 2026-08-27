import Link from "next/link";
import { InvoicePrintButton } from "@/components/invoice-print-button";
export function InvoiceView({
  payment,
  customer,
  orderLabel,
  backHref,
}: {
  payment: {reference:string;status:string;created_at:string;paid_at:string|null;currency:string;amount_minor:number;entity_type:string};
  customer: {first_name:string|null;last_name:string|null;email:string|null}|null;
  orderLabel: string;
  backHref: string;
}) {
  return (
    <main className="min-h-screen bg-[#ebe7de] px-6 py-12 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl bg-paper p-8 print:max-w-none">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-black/15 pb-8">
          <div>
            <p className="text-xs uppercase tracking-[.25em] text-gold">
              Studio Two
            </p>
            <h1 className="mt-2 font-display text-5xl">Invoice</h1>
            <p className="mt-3 font-mono text-xs">
              INV-{payment.reference.toUpperCase()}
            </p>
          </div>
          <div className="text-right text-sm">
            <strong className="capitalize">{payment.status}</strong>
            <p className="mt-2">
              Issued {new Date(payment.created_at).toLocaleDateString()}
            </p>
            {payment.paid_at && (
              <p>Paid {new Date(payment.paid_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <div className="grid gap-8 border-b border-black/15 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[.18em] text-black/45">
              Billed to
            </p>
            <p className="mt-2 font-medium">
              {customer?.first_name} {customer?.last_name}
            </p>
            <p className="text-sm text-black/55">{customer?.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[.18em] text-black/45">
              Order
            </p>
            <p className="mt-2 font-medium">{orderLabel}</p>
            <p className="text-sm capitalize text-black/55">
              {payment.entity_type.replaceAll("_", " ")}
            </p>
          </div>
        </div>
        <div className="py-8">
          <div className="flex justify-between gap-6 border-b border-black/10 py-4">
            <span>{orderLabel}</span>
            <strong>
              {payment.currency} {(payment.amount_minor / 100).toFixed(2)}
            </strong>
          </div>
          <div className="mt-5 flex justify-between text-2xl">
            <span>Total</span>
            <strong>
              {payment.currency} {(payment.amount_minor / 100).toFixed(2)}
            </strong>
          </div>
          <p className="mt-3 text-right text-sm capitalize text-black/50">
            Payment status: {payment.status}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-4 print:hidden">
          <Link href={backHref} className="border border-ink px-5 py-3 text-sm">
            ← Back to invoices
          </Link>
          <InvoicePrintButton />
        </div>
      </div>
    </main>
  );
}
