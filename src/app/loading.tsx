import{LoaderCircle}from"lucide-react";
export default function Loading(){return <div className="fixed inset-0 z-[120] grid place-items-center bg-paper/85 backdrop-blur-sm"><div className="flex items-center gap-3 bg-ink px-6 py-4 text-paper shadow-2xl"><LoaderCircle className="animate-spin" size={22}/><span className="text-sm">Loading…</span></div></div>}
