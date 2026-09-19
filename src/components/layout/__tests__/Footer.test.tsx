import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
}));

vi.mock("@/lib/spree", () => ({
  isWholesaleEnabled: () => false,
}));

vi.mock("@/lib/store", () => ({
  getStoreName: () => "Korgoo",
  getStoreDescription: () =>
    "Магазин Korgoo — оборудование и услуги безопасности.",
}));

import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("drops the Spree demo links and keeps the store columns", async () => {
    const element = await Footer({
      basePath: "/us/en",
      locale: "en",
      categoryLinks: null,
    });
    const { container } = render(element);

    expect(container.querySelectorAll('a[href*="github.com"]')).toHaveLength(0);
    expect(
      container.querySelectorAll('a[href*="spreecommerce.org"]'),
    ).toHaveLength(0);
    expect(container.textContent).not.toMatch(/Spree/i);

    const colophon = container.querySelector(".border-t");
    expect(colophon?.textContent).toContain("Korgoo");
    expect(colophon?.textContent).toContain("rights");

    expect(container.textContent).toContain("shop");
    expect(container.textContent).toContain("account");
    expect(container.textContent).toContain("policies");
  });
});
