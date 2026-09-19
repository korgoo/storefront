"use server";

import type { Country, Market } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import {
  getClient,
  getLocaleOptions,
  SpreeBuildOfflineError,
} from "@/lib/spree";

async function cachedListMarkets(options: {
  locale?: string;
  country?: string;
}): Promise<{ data: Market[] }> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("markets");
  try {
    return await getClient().markets.list(options);
  } catch (error) {
    if (error instanceof SpreeBuildOfflineError) return { data: [] };
    throw error;
  }
}

async function cachedResolveMarket(
  country: string,
  options: { locale?: string; country?: string },
): Promise<Market | null> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("resolved-market");
  try {
    return await getClient().markets.resolve(country, options);
  } catch (error) {
    if (error instanceof SpreeBuildOfflineError) return null;
    throw error;
  }
}

async function cachedListMarketCountries(
  marketId: string,
  options: { locale?: string; country?: string },
): Promise<{ data: Country[] }> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("market-countries");
  try {
    return await getClient().markets.countries.list(marketId, options);
  } catch (error) {
    if (error instanceof SpreeBuildOfflineError) return { data: [] };
    throw error;
  }
}

export async function getMarkets(options?: {
  locale?: string;
  country?: string;
}): Promise<{ data: Market[] }> {
  const resolvedOptions = options ?? (await getLocaleOptions());
  return cachedListMarkets(resolvedOptions);
}

export async function resolveMarket(country: string) {
  const options = await getLocaleOptions();
  return cachedResolveMarket(country, options);
}

export async function getMarketCountries(marketId: string) {
  const options = await getLocaleOptions();
  return cachedListMarketCountries(marketId, options);
}

/**
 * Resolve the currency for a given country on the server side, using the
 * cached markets list. Returns undefined if the country is not served by
 * any market.
 */
export async function resolveCurrency(
  country: string,
): Promise<string | undefined> {
  const { data: markets } = await getMarkets();
  const iso = country.toLowerCase();
  for (const market of markets) {
    const match = market.countries?.some((c) => c.iso.toLowerCase() === iso);
    if (match) return market.currency;
  }
  return undefined;
}
