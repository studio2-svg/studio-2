import { PortalShell } from "@/components/portal-shell";
import { requireAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
const labels = ["Overview","Studio","Bookings","Calendar","Customers","Equipment","Staff","Staff accounts","Services","Payments","Invoices","Website","Analytics","Audit logs","Settings"];
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const {profile}=await requireAdmin(); const unrestricted=["admin","owner"].includes(profile.role); const visible=labels.filter(label=>{if(label==="Overview")return true;if(unrestricted)return true;if(["Staff accounts","Audit logs","Settings"].includes(label))return false;return profile.permissions.includes(label.toLowerCase().replace(" ","-"));}); return <PortalShell title="Administration" nav={visible.map(label => ({ label, href: label === "Overview" ? "/admin" : `/admin/${label.toLowerCase().replace(" ", "-")}` }))}>{children}</PortalShell>; }
