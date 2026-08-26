import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
const labels = ["Overview","Studio","Bookings","Calendar","Customers","Equipment","Staff","Services","Payments","Invoices","Website","Analytics","Audit logs","Settings"];
export default async function AdminLayout({ children }: { children: React.ReactNode }) { await requireAdmin(); return <PortalShell title="Administration" nav={labels.map(label => ({ label, href: label === "Overview" ? "/admin" : `/admin/${label.toLowerCase().replace(" ", "-")}` }))}>{children}</PortalShell>; }
