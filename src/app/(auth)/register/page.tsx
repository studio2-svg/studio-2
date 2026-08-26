import { AuthForm } from "@/components/auth-form";
import { register } from "../actions";
export default function RegisterPage() { return <><p className="mt-16 text-xs uppercase tracking-[.25em] text-gold">Client portal</p><h1 className="mt-3 font-display text-5xl">Create your account.</h1><AuthForm mode="register" action={register}/></>; }
