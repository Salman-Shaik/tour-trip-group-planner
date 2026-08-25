import type { ReactNode } from "react";

export const inputClass = "min-h-12 w-full rounded-xl border border-[#dcded8] bg-white px-3.5 text-[16px] text-[#18342f] outline-none transition placeholder:text-[#9aa5a1] focus:border-[#1f7168] focus:ring-4 focus:ring-[#1f7168]/10";

export function FormField({ label, name, error, hint, children }: { label:string; name:string; error?:string[]; hint?:string; children:ReactNode }) {
  return <div className="block"><label className="mb-2 block text-sm font-bold text-[#29443e]" htmlFor={name}>{label}</label>{children}{error?.[0] ? <span className="mt-1.5 block text-sm font-medium text-[#c7442b]">{error[0]}</span> : hint ? <span className="mt-1.5 block text-xs leading-5 text-[#71807c]">{hint}</span> : null}</div>;
}
