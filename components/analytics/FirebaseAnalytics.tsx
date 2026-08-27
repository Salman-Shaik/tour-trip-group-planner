"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { declineFirebaseAnalytics, recordPageView } from "@/lib/firebase-client";

const consentKey = "roamly-analytics-consent";
type Consent = "accepted" | "declined";

export function FirebaseAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(consentKey);
      setConsent(stored === "accepted" || stored === "declined" ? stored : null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (consent === "accepted") void recordPageView(pathname);
  }, [consent, pathname]);

  function choose(value: Consent) {
    if (value === "declined") void declineFirebaseAnalytics();
    window.localStorage.setItem(consentKey, value);
    setConsent(value);
  }

  if (consent === undefined) return null;
  if (consent !== null) {
    return <button type="button" onClick={() => setConsent(null)} className="fixed bottom-3 left-3 z-40 rounded-full border border-[#cfd8d4] bg-white/95 px-3 py-2 text-xs font-bold text-[#285f54] shadow-sm backdrop-blur dark:border-[#3b514a] dark:bg-[#14221e]/95 dark:text-[#b8d6cc]">Analytics settings</button>;
  }

  return <aside role="dialog" aria-label="Analytics preferences" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-[#cfd8d4] bg-white p-4 text-sm text-[#29443e] shadow-[0_16px_50px_rgba(18,42,36,.22)] dark:border-[#3b514a] dark:bg-[#14221e] dark:text-[#e6f0ec] sm:flex sm:items-center sm:gap-4">
    <p className="leading-5"><strong>Help improve Roamly.</strong> Allow anonymous Firebase Analytics to understand which parts of the planner are useful. No trip details or votes are sent as custom events.</p>
    <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
      <button type="button" onClick={() => choose("declined")} className="min-h-10 rounded-full border border-[#cfd8d4] px-4 font-bold dark:border-[#536b63]">Decline</button>
      <button type="button" onClick={() => choose("accepted")} className="min-h-10 rounded-full bg-[#1f7168] px-4 font-bold text-white">Allow</button>
    </div>
  </aside>;
}
