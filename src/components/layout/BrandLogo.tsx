import Image from "next/image";
import { getAssetBasePath, getStoreName } from "@/lib/store";

/**
 * The landing page's mark and wordmark (frontend/src/landing/BrandMark.tsx),
 * scaled from its 52px header slot to 32px. `tunduk-shield.svg` is a byte
 * copy of frontend/assets/tunduk-shield.svg. The image is decorative: the
 * wordmark names the link.
 */
export function BrandLogo() {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <Image
        src={`${getAssetBasePath()}/tunduk-shield.svg`}
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="size-8 shrink-0 overflow-hidden rounded-[9px]"
        fetchPriority="high"
        loading="eager"
      />
      <span className="truncate text-lg font-bold leading-none text-gray-900">
        {getStoreName()}
      </span>
    </span>
  );
}
