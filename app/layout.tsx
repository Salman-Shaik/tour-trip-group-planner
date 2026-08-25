import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { TabletAvailability } from "@/components/layout/TabletAvailability";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import "./globals.css";

const sans = DM_Sans({ subsets:["latin"], variable:"--font-sans" });
const display = Newsreader({ subsets:["latin"], variable:"--font-display" });
export const metadata: Metadata = { title:"Roamly — Decide together, travel better", description:"Collect, compare, and vote on group stays in one beautiful place." };
export const viewport: Viewport = { width:"device-width", initialScale:1, viewportFit:"cover", themeColor:"#fbfaf7" };

export default function RootLayout({ children }: Readonly<{ children:React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${sans.variable} ${display.variable}`}><div className="app-content">{children}</div><TabletAvailability/><ThemeToggle/></body></html>;
}
