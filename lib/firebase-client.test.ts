import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getApp: vi.fn(),
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  initializeAnalytics: vi.fn(),
  isSupported: vi.fn(),
  logEvent: vi.fn(),
  setConsent: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  getApp: mocks.getApp,
  getApps: mocks.getApps,
  initializeApp: mocks.initializeApp,
}));

vi.mock("firebase/analytics", () => ({
  initializeAnalytics: mocks.initializeAnalytics,
  isSupported: mocks.isSupported,
  logEvent: mocks.logEvent,
  setConsent: mocks.setConsent,
}));

const configuration = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "example.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "project.firebasestorage.app",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "sender",
  NEXT_PUBLIC_FIREBASE_APP_ID: "app",
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-TEST",
};

describe("Firebase Analytics client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    for (const [key, value] of Object.entries(configuration)) vi.stubEnv(key, value);
    vi.stubGlobal("window", { location:{ href:"https://roamly.example/trips" } });
    vi.stubGlobal("document", { title:"Trips" });
    mocks.isSupported.mockResolvedValue(true);
    mocks.getApps.mockReturnValue([]);
    mocks.initializeApp.mockReturnValue({ name:"new" });
    mocks.getApp.mockReturnValue({ name:"existing" });
    mocks.initializeAnalytics.mockReturnValue({ app:"analytics" });
  });

  it("does not initialize when public configuration is incomplete", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    const { loadFirebaseAnalytics } = await import("@/lib/firebase-client");
    expect(await loadFirebaseAnalytics()).toBeNull();
    expect(mocks.isSupported).not.toHaveBeenCalled();
  });

  it("does not initialize in an unsupported browser", async () => {
    mocks.isSupported.mockResolvedValue(false);
    const { loadFirebaseAnalytics } = await import("@/lib/firebase-client");
    expect(await loadFirebaseAnalytics()).toBeNull();
    expect(mocks.initializeApp).not.toHaveBeenCalled();
  });

  it("initializes a configured Firebase app only once", async () => {
    const { loadFirebaseAnalytics } = await import("@/lib/firebase-client");
    const first = await loadFirebaseAnalytics();
    const second = await loadFirebaseAnalytics();
    expect(first).toEqual({ app:"analytics" });
    expect(second).toBe(first);
    expect(mocks.initializeApp).toHaveBeenCalledWith(expect.objectContaining({ projectId:"project", measurementId:"G-TEST" }));
    expect(mocks.initializeAnalytics).toHaveBeenCalledWith({ name:"new" }, { config:{ send_page_view:false } });
    expect(mocks.initializeAnalytics).toHaveBeenCalledTimes(1);
  });

  it("reuses an existing Firebase app", async () => {
    mocks.getApps.mockReturnValue([{ name:"existing" }]);
    const { loadFirebaseAnalytics } = await import("@/lib/firebase-client");
    await loadFirebaseAnalytics();
    expect(mocks.getApp).toHaveBeenCalled();
    expect(mocks.initializeApp).not.toHaveBeenCalled();
  });

  it("records page views without trip-specific custom data", async () => {
    const { recordPageView } = await import("@/lib/firebase-client");
    await recordPageView("/trips");
    expect(mocks.logEvent).toHaveBeenCalledWith({ app:"analytics" }, "page_view", {
      page_location:"https://roamly.example/trips",
      page_path:"/trips",
      page_title:"Trips",
    });
  });

  it("does not record a page view when Analytics is unavailable", async () => {
    mocks.isSupported.mockResolvedValue(false);
    const { recordPageView } = await import("@/lib/firebase-client");
    await recordPageView("/trips");
    expect(mocks.logEvent).not.toHaveBeenCalled();
  });

  it("does not load Analytics merely to decline it", async () => {
    const { declineFirebaseAnalytics } = await import("@/lib/firebase-client");
    await declineFirebaseAnalytics();
    expect(mocks.isSupported).not.toHaveBeenCalled();
    expect(mocks.setConsent).not.toHaveBeenCalled();
  });

  it("withdraws all Analytics and advertising consent after initialization", async () => {
    const { declineFirebaseAnalytics, loadFirebaseAnalytics } = await import("@/lib/firebase-client");
    await loadFirebaseAnalytics();
    await declineFirebaseAnalytics();
    expect(mocks.setConsent).toHaveBeenCalledWith({
      analytics_storage:"denied",
      ad_storage:"denied",
      ad_user_data:"denied",
      ad_personalization:"denied",
    });
  });
});
