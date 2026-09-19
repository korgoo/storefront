"use server";

import type {
  PaginatedResponse,
  Product,
  ProductFiltersResponse,
  ProductListParams,
} from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import {
  cacheTagSuffix,
  DEFAULT_SURFACE,
  getAccessToken,
  getClientForSurface,
  getLocaleOptions,
  SpreeBuildOfflineError,
  type Surface,
} from "@/lib/spree";

const EMPTY_PAGINATED_RESPONSE: PaginatedResponse<Product> = {
  data: [],
  meta: {
    page: 1,
    limit: 0,
    count: 0,
    pages: 0,
    from: 0,
    to: 0,
    in: 0,
    previous: null,
    next: null,
  },
};

const EMPTY_PRODUCT_FILTERS: ProductFiltersResponse = {
  filters: [],
  sort_options: [],
  default_sort: "",
  total_count: 0,
};

/**
 * Cached product list fetch. Cache key is derived from all function
 * arguments by Next.js "use cache":
 *
 * - locale/country: determines language and market-specific pricing
 * - surface: DTC vs wholesale — different catalog + channel pricing. Baked
 *   into both the cache tag and the arguments so the two never share entries.
 * - userToken: per-user cache segmentation (separate arg, NOT passed to
 *   SDK). Authenticated users may see different prices (B2B, loyalty).
 *   Each user's JWT is unique so the cache is segmented per user.
 *   Guest users pass undefined. On the wholesale surface the token is
 *   always present — the channel 401s guests.
 */
export async function cachedListProducts(
  params: ProductListParams | undefined,
  options: { locale?: string; country?: string },
  surface: Surface,
  userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag(`products${cacheTagSuffix(surface)}`);
  try {
    return await getClientForSurface(surface).products.list(params, {
      ...options,
      // Wholesale catalog requires the customer JWT — the channel is gated.
      ...(surface === "wholesale" && userToken
        ? { token: userToken }
        : undefined),
    });
  } catch (error) {
    if (error instanceof SpreeBuildOfflineError)
      return EMPTY_PAGINATED_RESPONSE;
    throw error;
  }
}

export async function getProducts(
  params?: ProductListParams,
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListProducts(params, options, surface, userToken);
}

/**
 * Persistent cached product detail fetch. Cache key is derived from:
 *
 * - slugOrId, expand: identify the product and response shape
 * - locale/country: determines language and market-specific pricing
 * - surface: DTC vs wholesale — see cachedListProducts
 * - userToken: per-user cache segmentation (separate arg, NOT passed to
 *   SDK). Authenticated users may see different prices (B2B, loyalty).
 *   Guest users pass undefined, so all guests share one entry.
 */
export async function cachedGetProduct(
  slugOrId: string,
  expand: string[],
  options: { locale?: string; country?: string },
  surface: Surface,
  userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag(
    `products${cacheTagSuffix(surface)}`,
    `product:${slugOrId}${cacheTagSuffix(surface)}`,
  );
  return getClientForSurface(surface).products.get(
    slugOrId,
    { expand },
    {
      ...options,
      ...(surface === "wholesale" && userToken
        ? { token: userToken }
        : undefined),
    },
  );
}

export async function getProduct(
  slugOrId: string,
  params?: { expand?: string[] },
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProduct(
    slugOrId,
    params?.expand ?? [],
    options,
    surface,
    userToken,
  );
}

async function cachedGetProductFilters(
  params: Record<string, unknown> | undefined,
  options: { locale?: string; country?: string },
  surface: Surface,
  userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag(`product-filters${cacheTagSuffix(surface)}`);
  try {
    return await getClientForSurface(surface).products.filters(params, {
      ...options,
      ...(surface === "wholesale" && userToken
        ? { token: userToken }
        : undefined),
    });
  } catch (error) {
    if (error instanceof SpreeBuildOfflineError) return EMPTY_PRODUCT_FILTERS;
    throw error;
  }
}

export async function getProductFilters(
  params?: Record<string, unknown>,
  surface: Surface = DEFAULT_SURFACE,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProductFilters(params, options, surface, userToken);
}
