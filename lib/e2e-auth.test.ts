import { afterEach,describe,expect,it,vi } from "vitest";
import { isE2EAuthEnabled } from "@/lib/e2e-auth";

describe("E2E authentication guard",()=>{
  afterEach(()=>vi.unstubAllEnvs());
  it("requires the explicit test flag outside production",()=>{vi.stubEnv("NODE_ENV","test");vi.stubEnv("ROAMLY_E2E_AUTH","true");expect(isE2EAuthEnabled()).toBe(true);vi.stubEnv("ROAMLY_E2E_AUTH","false");expect(isE2EAuthEnabled()).toBe(false);});
  it("can never be enabled in production",()=>{vi.stubEnv("NODE_ENV","production");vi.stubEnv("ROAMLY_E2E_AUTH","true");expect(isE2EAuthEnabled()).toBe(false);});
});
