import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/store", () => ({
  getStoreName: () => "Korgoo",
  getAssetBasePath: () => "/store",
}));

import { BrandLogo } from "@/components/layout/BrandLogo";

describe("BrandLogo", () => {
  it("renders the landing shield as a decorative image under the basePath", () => {
    const { container } = render(<BrandLogo />);

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("alt", "");
    expect(decodeURIComponent(img?.getAttribute("src") ?? "")).toContain(
      "/store/tunduk-shield.svg",
    );
  });

  it("renders the store name as the wordmark", () => {
    render(<BrandLogo />);

    expect(screen.getByText("Korgoo")).toBeInTheDocument();
  });

  it("does not reference the old logo", () => {
    const { container } = render(<BrandLogo />);

    expect(container.innerHTML).not.toContain("korgoo-logo.svg");
  });
});
