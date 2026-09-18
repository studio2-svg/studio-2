"use client";

/* eslint-disable @next/next/no-img-element -- Studio images are uploaded through the CMS. */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type Studio = { id:string; name:string; currency:string; description:string|null; cover_image_url:string|null; price_minor:number; pricing_type:string };
type StudioImage = { id:string; studio_id:string; image_url:string; alt_text:string|null };
type Preview = { studioName:string; images:StudioImage[]; index:number };

export function StudioBookingPicker({studios,studioImages}:{studios:Studio[];studioImages:StudioImage[]}) {
  const [preview,setPreview]=useState<Preview|null>(null);
  const touchStart=useRef<number|null>(null);
  const galleries=useMemo(()=>Object.fromEntries(studios.map(studio=>{
    const gallery=studioImages.filter(image=>image.studio_id===studio.id);
    const images=studio.cover_image_url?[{id:`cover-${studio.id}`,studio_id:studio.id,image_url:studio.cover_image_url,alt_text:`${studio.name} cover image`},...gallery.filter(image=>image.image_url!==studio.cover_image_url)]:gallery;
    return [studio.id,images];
  })) as Record<string,StudioImage[]>,[studios,studioImages]);
  const move=(direction:number)=>setPreview(current=>current?{...current,index:(current.index+direction+current.images.length)%current.images.length}:null);

  useEffect(()=>{
    if(!preview)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setPreview(null);if(event.key==="ArrowLeft")move(-1);if(event.key==="ArrowRight")move(1)};
    window.addEventListener("keydown",onKeyDown);
    return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener("keydown",onKeyDown)};
  },[preview]);

  return <>
    <div className="grid gap-4 sm:grid-cols-2">
      {studios.map(studio=>{const images=galleries[studio.id]||[];return <article key={studio.id} className="group overflow-hidden border border-black/10 bg-white transition hover:border-gold hover:shadow-lg">
        {images[0]&&<button type="button" onClick={()=>setPreview({studioName:studio.name,images,index:0})} className="relative block w-full cursor-zoom-in overflow-hidden text-left" aria-label={`Preview photos of ${studio.name}`}>
          <img src={images[0].image_url} alt={images[0].alt_text||studio.name} className="aspect-video w-full object-cover transition duration-500 group-hover:scale-105"/>
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 bg-black/75 px-3 py-2 text-xs text-white backdrop-blur-sm"><Expand size={14}/> View {images.length} photo{images.length===1?"":"s"}</span>
        </button>}
        {images.length>1&&<div className="grid grid-cols-4 gap-1 p-1">{images.slice(1,5).map((image,index)=><button type="button" key={image.id} onClick={()=>setPreview({studioName:studio.name,images,index:index+1})} className="relative cursor-zoom-in overflow-hidden" aria-label={`Open photo ${index+2} of ${studio.name}`}>
          <img src={image.image_url} alt={image.alt_text||studio.name} className="aspect-square w-full object-cover transition hover:scale-105"/>{index===3&&images.length>5&&<span className="absolute inset-0 grid place-items-center bg-black/65 text-sm font-medium text-white">+{images.length-5}</span>}
        </button>)}</div>}
        <label className="block cursor-pointer p-4"><span className="flex items-center gap-2"><input type="radio" name="studio_id" value={studio.id} required/><strong>{studio.name}</strong></span><small className="mt-2 block text-black/50">{studio.description}</small><small className="mt-2 block font-medium">{studio.currency} {(studio.price_minor/100).toFixed(2)} · {studio.pricing_type}</small></label>
      </article>})}
    </div>
    {preview&&<div role="dialog" aria-modal="true" aria-label={`${preview.studioName} photo gallery`} className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-3 text-white sm:p-6" onClick={()=>setPreview(null)}>
      <div className="flex items-center justify-between gap-4"><div><p className="font-display text-2xl">{preview.studioName}</p><p className="text-xs text-white/60">Photo {preview.index+1} of {preview.images.length}</p></div><button type="button" onClick={()=>setPreview(null)} className="grid size-11 place-items-center border border-white/25 transition hover:bg-white hover:text-black" aria-label="Close photo preview"><X size={22}/></button></div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center py-4" onClick={event=>event.stopPropagation()} onTouchStart={event=>(touchStart.current=event.touches[0].clientX)} onTouchEnd={event=>{if(touchStart.current===null)return;const distance=event.changedTouches[0].clientX-touchStart.current;if(Math.abs(distance)>45)move(distance>0?-1:1);touchStart.current=null}}>
        <img src={preview.images[preview.index].image_url} alt={preview.images[preview.index].alt_text||preview.studioName} className="max-h-full max-w-full select-none object-contain"/>
        {preview.images.length>1&&<><button type="button" onClick={()=>move(-1)} className="absolute left-0 grid size-11 place-items-center bg-black/70 transition hover:bg-white hover:text-black sm:left-3 sm:size-12" aria-label="Previous photo"><ChevronLeft size={26}/></button><button type="button" onClick={()=>move(1)} className="absolute right-0 grid size-11 place-items-center bg-black/70 transition hover:bg-white hover:text-black sm:right-3 sm:size-12" aria-label="Next photo"><ChevronRight size={26}/></button></>}
      </div>
      {preview.images.length>1&&<div className="flex max-w-full gap-2 overflow-x-auto pb-1" onClick={event=>event.stopPropagation()}>{preview.images.map((image,index)=><button type="button" key={image.id} onClick={()=>setPreview(current=>current&&{...current,index})} className={`shrink-0 border-2 ${index===preview.index?"border-gold":"border-transparent opacity-55 hover:opacity-100"}`} aria-label={`View photo ${index+1}`}><img src={image.image_url} alt="" className="h-16 w-24 object-cover sm:h-20 sm:w-28"/></button>)}</div>}
    </div>}
  </>;
}
