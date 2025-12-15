import { tool } from "ai";
import { z } from "zod";
import {
  type CAICClient,
  formatAvalancheForecast,
  formatRegionalDiscussion,
  formatSpecialProduct,
} from "../caic";

/**
 * Creates an avalanche info tool that fetches forecast data for a location.
 * Requires lat/lng coordinates - use the geocode tool first if you only have a location name.
 *
 * @param client - CAIC API client instance
 */
export function createAvalancheInfoTool(client: CAICClient) {
  return tool({
    description:
      "Fetch avalanche forecast, regional discussion, or special product for a given location. Requires lat/lng coordinates - use the geocode tool first if you only have a location name.",
    inputSchema: z.object({
      productType: z
        .enum(["avalancheforecast", "regionaldiscussion", "specialproduct"])
        .describe("The type of avalanche product to fetch"),
      lat: z.number().describe("Latitude of the location"),
      lng: z.number().describe("Longitude of the location"),
    }),
    execute: async ({ productType, lat, lng }) => {
      const product = await client.fetchForecastForLocation(productType, {
        lat,
        lng,
      });

      if (!product) {
        return { error: "No forecast available for this location" };
      }

      if (
        productType === "avalancheforecast" &&
        product.type === "avalancheforecast"
      ) {
        const content = formatAvalancheForecast(product);
        return { content: formatAvalancheForecast(product) };
      }
      if (
        productType === "regionaldiscussion" &&
        product.type === "regionaldiscussion"
      ) {
        return { content: formatRegionalDiscussion(product) };
      }
      if (
        productType === "specialproduct" &&
        product.type === "specialproduct"
      ) {
        return { content: formatSpecialProduct(product) };
      }

      return { error: "Unexpected product type" };
    },
  });
}
