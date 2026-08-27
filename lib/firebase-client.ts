import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAnalytics, isSupported, logEvent, setConsent, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let analyticsPromise: Promise<Analytics | null> | undefined;

function hasAnalyticsConfiguration() {
  return Object.values(firebaseConfig).every(Boolean);
}

export function loadFirebaseAnalytics() {
  analyticsPromise ??= (async () => {
    if (!hasAnalyticsConfiguration() || !(await isSupported())) return null;
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return initializeAnalytics(app, { config:{ send_page_view:false } });
  })();
  return analyticsPromise;
}

export async function declineFirebaseAnalytics() {
  if (!analyticsPromise) return;
  await analyticsPromise;
  setConsent({ analytics_storage:"denied", ad_storage:"denied", ad_user_data:"denied", ad_personalization:"denied" });
}

export async function recordPageView(pathname: string) {
  const analytics = await loadFirebaseAnalytics();
  if (!analytics) return;
  logEvent(analytics, "page_view", {
    page_location: window.location.href,
    page_path: pathname,
    page_title: document.title,
  });
}
