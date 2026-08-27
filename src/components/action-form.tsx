"use client";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { NotificationDialog } from "@/components/notification-dialog";

type Notice = { kind: "success" | "error"; message: string } | null;
export function ActionForm({
  action,
  successMessage,
  className,
  children,
}: {
  action: (data: FormData) => Promise<void>;
  successMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false),
    [notice, setNotice] = useState<Notice>(null);
  async function submit(data: FormData) {
    setPending(true);
    setNotice(null);
    try {
      await action(data);
      setNotice({ kind: "success", message: successMessage });
    } catch (error) {
      if(typeof error==="object"&&error!==null&&"digest" in error&&String(error.digest).startsWith("NEXT_REDIRECT"))throw error;
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
      {notice && <NotificationDialog kind={notice.kind} message={notice.message} />}
    </>
  );
}
