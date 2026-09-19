import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getClient,
  resetClient,
  SpreeBuildOfflineError,
} from "@/lib/spree/config";

describe("getClient build-offline gate", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetClient();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetClient();
  });

  it("still throws the existing config error when the gate is unset and env vars are missing", () => {
    delete process.env.SPREE_BUILD_OFFLINE;
    delete process.env.SPREE_API_URL;
    delete process.env.SPREE_PUBLISHABLE_KEY;

    expect(() => getClient()).toThrow("Spree client is not configured");
  });

  it("returns a client whose calls reject with SpreeBuildOfflineError when the gate is set", async () => {
    process.env.SPREE_BUILD_OFFLINE = "1";
    delete process.env.SPREE_API_URL;
    delete process.env.SPREE_PUBLISHABLE_KEY;

    const client = getClient();

    await expect(client.markets.list()).rejects.toBeInstanceOf(
      SpreeBuildOfflineError,
    );
    await expect(client.products.get("some-slug", {})).rejects.toBeInstanceOf(
      SpreeBuildOfflineError,
    );
  });

  it("prefers the offline gate even when real credentials are present", async () => {
    process.env.SPREE_BUILD_OFFLINE = "1";
    process.env.SPREE_API_URL = "https://api.korgoo.kg";
    process.env.SPREE_PUBLISHABLE_KEY = "real-key";

    await expect(getClient().categories.list()).rejects.toBeInstanceOf(
      SpreeBuildOfflineError,
    );
  });
});
