import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
}));

vi.mock("@/lib/store", () => ({
  getStoreName: () => "Korgoo",
}));

import { HeroSection } from "@/components/home/HeroSection";

describe("HeroSection", () => {
  it("keeps the catalog CTA and drops the demo links", async () => {
    const element = await HeroSection({ basePath: "/us/en", locale: "en" });
    const { container } = render(element);

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/us/en/products");

    expect(container.querySelectorAll('a[href*="github.com"]')).toHaveLength(0);
    expect(
      container.querySelectorAll('a[href*="spreecommerce.org"]'),
    ).toHaveLength(0);
  });
});
