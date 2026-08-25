import { Laptop, MapPinned, Smartphone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function TabletAvailability() {
  return (
    <aside className="tablet-availability" aria-labelledby="tablet-title">
      <div className="tablet-availability__card">
        <Logo />
        <div className="tablet-availability__icon" aria-hidden="true">
          <MapPinned size={34} strokeWidth={2.2} />
        </div>
        <p className="tablet-availability__eyebrow">A quick travel note</p>
        <h1 id="tablet-title" className="display-font tablet-availability__title">
          Roamly is available on desktop and mobile.
        </h1>
        <p className="tablet-availability__copy">
          Tablet support is still being prepared. Please continue on a computer or open this link on your phone for the best experience.
        </p>
        <div className="tablet-availability__devices" aria-label="Supported devices">
          <span><Laptop size={20} /> Desktop</span>
          <span><Smartphone size={20} /> Mobile</span>
        </div>
      </div>
    </aside>
  );
}
