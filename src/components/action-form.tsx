"use client";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { NotificationDialog } from "@/components/notification-dialog";

type Notice = { kind: "success" | "error"; message: string } | null;
type CheckoutReview = {
  title: string;
  reference: string;
  period: string;
  currency: string;
  items: readonly { label: string; detail?: string; amountMinor: number }[];
  totalMinor: number;
};
export function ActionForm({
  action,
  successMessage,
  className,
  children,
}: {
  action: (
    data: FormData,
  ) => Promise<
    | void
    | { redirectTo: string }
    | { error: string }
    | { review: CheckoutReview }
  >;
  successMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false),
    [notice, setNotice] = useState<Notice>(null),
    [review, setReview] = useState<CheckoutReview | null>(null),
    [checkoutData, setCheckoutData] = useState<FormData | null>(null);
  async function submit(data: FormData, confirmed = false) {
    setPending(true);
    setNotice(null);
    try {
      if (confirmed) data.set("confirm_checkout", "yes");
      const result = await action(data);
      if (result && "error" in result) {
        setNotice({ kind: "error", message: result.error });
        return;
      }
      if (result && "redirectTo" in result) {
        window.location.assign(result.redirectTo);
        return;
      }
      if (result && "review" in result) {
        setCheckoutData(data);
        setReview(result.review);
        return;
      }
      setNotice({ kind: "success", message: successMessage });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        String(error.digest).startsWith("NEXT_REDIRECT")
      )
        throw error;
      setNotice({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <form action={submit} className={className} aria-busy={pending}>
        {children}
        {pending && (
          <p className="flex items-center gap-2 text-sm text-black/50">
            <LoaderCircle className="animate-spin" size={16} /> Working…
          </p>
        )}
      </form>
      {notice && (
        <NotificationDialog kind={notice.kind} message={notice.message} />
      )}
      {review && checkoutData && (
        <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            className="my-8 w-full max-w-xl bg-paper p-6 shadow-2xl"
          >
            <p className="text-xs uppercase tracking-[.2em] text-gold">
              Pre-invoice
            </p>
            <h2 className="mt-2 font-display text-4xl">{review.title}</h2>
            <div className="mt-5 border-y border-black/10 py-4 text-sm text-black/55">
              <p>{review.reference}</p>
              <p className="mt-1">{review.period}</p>
            </div>
            <div className="mt-4 divide-y divide-black/10">
              {review.items.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="flex justify-between gap-5 py-3 text-sm"
                >
                  <span>
                    <strong className="block font-medium">{item.label}</strong>
                    {item.detail && (
                      <small className="text-black/50">{item.detail}</small>
                    )}
                  </span>
                  <span className="shrink-0">
                    {review.currency} {(item.amountMinor / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t-2 border-ink pt-4 text-lg">
              <strong>Total</strong>
              <strong>
                {review.currency} {(review.totalMinor / 100).toFixed(2)}
              </strong>
            </div>
            <p className="mt-4 text-xs leading-5 text-black/50">
              Review these details carefully. Your booking is created only when
              you proceed to secure payment.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setReview(null);
                  setCheckoutData(null);
                }}
                className="border border-ink px-5 py-3 text-sm"
              >
                Back and edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => submit(checkoutData, true)}
                className="bg-ink px-5 py-3 text-sm text-paper disabled:opacity-50"
              >
                {pending ? "Opening payment…" : "Proceed to payment"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
