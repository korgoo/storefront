"use server";

import type {
  Category,
  CategoryListParams,
  PaginatedResponse,
  ProductListParams,
} from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import {
  getAccessToken,
  getClient,
  getLocaleOptions,
  SpreeBuildOfflineError,
} from "@/lib/spree";

const EMPTY_CATEGORIES_RESPONSE: PaginatedResponse<Category> = {
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

async function cachedListCategories(
  params: CategoryListParams | undefined,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("categories");
  try {
    return await getClient().categories.list(params, options);
  } catch (error) {
    if (error instanceof SpreeBuildOfflineError)
      return EMPTY_CATEGORIES_RESPONSE;
    throw error;
  }
}

export async function getCategories(
  params?: CategoryListParams,
  options?: { locale?: string; country?: string },
) {
  const localeOptions = options ?? (await getLocaleOptions());
  return cachedListCategories(params, localeOptions);
}

export async function cachedGetCategory(
  idOrPermalink: string,
  params: { expand?: string[] } | undefined,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("category");
  return getClient().categories.get(idOrPermalink, params, options);
}

export async function getCategory(
  idOrPermalink: string,
  params?: { expand?: string[] },
) {
  const options = await getLocaleOptions();
  return cachedGetCategory(idOrPermalink, params, options);
}

/**
 * Persistent cached category products fetch. Cache key is derived from
 * all function arguments (categoryId, params, locale, country, userToken).
 * Guest users pass undefined so the cache entry is shared.
 */
async function cachedListCategoryProducts(
  categoryId: string,
  params: ProductListParams | undefined,
  options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products", `category-products:${categoryId}`);
  return getClient().products.list(
    { ...params, in_category: categoryId },
    options,
  );
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListCategoryProducts(categoryId, params, options, userToken);
}
