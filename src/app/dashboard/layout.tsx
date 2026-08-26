import { PortalShell } from "@/components/portal-shell";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
const nav = ["Overview", "Bookings", "Invoices", "Payments", "Profile", "Notifications"].map(label => ({ label, href: label === "Overview" ? "/dashboard" : `/dashboard/${label.toLowerCase()}` }));
export default async function DashboardLayout({ children }: { children: React.ReactNode }) { await requireUser(); return <PortalShell title="Client dashboard" nav={nav}>{children}</PortalShell>; }
