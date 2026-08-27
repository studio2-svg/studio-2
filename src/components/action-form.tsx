"use client";
import { CheckCircle2, LoaderCircle, X, XCircle } from "lucide-react";
import { useState } from "react";

type Notice={kind:"success"|"error";message:string}|null;
export function ActionForm({action,successMessage,className,children}:{action:(data:FormData)=>Promise<void>;successMessage:string;className?:string;children:React.ReactNode}){
  const[pending,setPending]=useState(false),[notice,setNotice]=useState<Notice>(null);
  async function submit(data:FormData){setPending(true);setNotice(null);try{await action(data);setNotice({kind:"success",message:successMessage})}catch(error){setNotice({kind:"error",message:error instanceof Error?error.message:"Something went wrong. Please try again."})}finally{setPending(false)}}
  return <><form action={submit} className={className} aria-busy={pending}>{children}{pending&&<p className="flex items-center gap-2 text-sm text-black/50"><LoaderCircle className="animate-spin" size={16}/> Saving...</p>}</form>{notice&&<div role="dialog" aria-live="polite" aria-label={notice.kind==="success"?"Success":"Error"} className="fixed inset-x-4 bottom-4 z-[70] mx-auto flex max-w-md items-start gap-3 border border-black/15 bg-paper p-4 shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6"><span className={notice.kind==="success"?"text-green-700":"text-red-700"}>{notice.kind==="success"?<CheckCircle2 size={21}/>:<XCircle size={21}/>}</span><div className="flex-1"><strong className="text-sm">{notice.kind==="success"?"Successful":"Could not complete action"}</strong><p className="mt-1 text-sm text-black/60">{notice.message}</p></div><button type="button" onClick={()=>setNotice(null)} aria-label="Dismiss notification"><X size={18}/></button></div>}</>;
}
