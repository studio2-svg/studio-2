"use client";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { useState } from "react";
export function NotificationDialog({
  kind,
  message,
}: {
  kind: "success" | "error";
  message?: string;
}) {
  const [dismissedMessage, setDismissedMessage] = useState<string>();
  if (!message || dismissedMessage === message) return null;
  return (
    <div
      role="dialog"
      aria-live="assertive"
      aria-label={kind === "success" ? "Success" : "Error"}
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-md items-start gap-3 border border-black/15 bg-paper p-4 text-ink shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <span className={kind === "success" ? "text-green-700" : "text-red-700"}>
        {kind === "success" ? (
          <CheckCircle2 size={21} />
        ) : (
          <XCircle size={21} />
        )}
      </span>
      <div className="flex-1">
        <strong className="text-sm">
          {kind === "success" ? "Successful" : "Could not complete action"}
        </strong>
        <p className="mt-1 text-sm text-black/60">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissedMessage(message)}
        aria-label="Dismiss notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}
