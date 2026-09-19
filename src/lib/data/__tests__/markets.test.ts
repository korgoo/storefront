import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  marketsList: vi.fn(),
}));

const MockSpreeBuildOfflineError = vi.hoisted(
  () => class MockSpreeBuildOfflineError extends Error {},
);

vi.mock("@/lib/spree", () => ({
  getClient: () => ({ markets: { list: api.marketsList } }),
  getLocaleOptions: vi.fn().mockResolvedValue({ country: "us", locale: "en" }),
  SpreeBuildOfflineError: MockSpreeBuildOfflineError,
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import { getMarkets } from "@/lib/data/markets";

describe("getMarkets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves to an empty list when the client rejects with the build-offline error", async () => {
    api.marketsList.mockRejectedValue(new MockSpreeBuildOfflineError());

    await expect(getMarkets({ country: "us", locale: "en" })).resolves.toEqual({
      data: [],
    });
  });

  it("does not swallow a real outage", async () => {
    const error = new TypeError("fetch failed");
    api.marketsList.mockRejectedValue(error);

    await expect(getMarkets({ country: "us", locale: "en" })).rejects.toBe(
      error,
    );
  });
});
