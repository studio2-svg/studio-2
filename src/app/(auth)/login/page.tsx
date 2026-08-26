import { AuthForm } from "@/components/auth-form";
import { login } from "../actions";
export default function LoginPage() { return <><p className="mt-16 text-xs uppercase tracking-[.25em] text-gold">Client portal</p><h1 className="mt-3 font-display text-5xl">Welcome back.</h1><AuthForm mode="login" action={login}/></>; }
