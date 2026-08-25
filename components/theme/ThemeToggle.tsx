"use client";

import { useEffect,useSyncExternalStore } from "react";
import { Moon,Sun } from "lucide-react";

type Theme="light"|"dark";
const subscribe=(callback:()=>void)=>{window.addEventListener("roamly-theme-change",callback);return()=>window.removeEventListener("roamly-theme-change",callback)};
const snapshot=():Theme=>document.documentElement.dataset.theme==="dark"?"dark":"light";
export function ThemeToggle(){const theme=useSyncExternalStore(subscribe,snapshot,()=>"light");useEffect(()=>{let saved:Theme|null=null;try{const value=localStorage.getItem("roamly-theme");saved=value==="dark"||value==="light"?value:null;}catch{}const initial=saved??(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=initial;window.dispatchEvent(new Event("roamly-theme-change"));},[]);const toggle=()=>{const next=theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;try{localStorage.setItem("roamly-theme",next)}catch{}window.dispatchEvent(new Event("roamly-theme-change"))};const dark=theme==="dark";return <button type="button" role="switch" aria-checked={dark} aria-label={`Switch to ${dark?"light":"dark"} theme`} onClick={toggle} className="theme-toggle"><span className="theme-toggle__track"><span className="theme-toggle__thumb">{dark?<Moon size={14}/>:<Sun size={14}/>}</span></span><span className="theme-toggle__label">{dark?"Dark":"Light"}</span></button>}
