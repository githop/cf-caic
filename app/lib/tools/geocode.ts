import { tool } from "ai";
import { z } from "zod";

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
}

/**
 * Creates a geocode tool that converts location names to lat/lng coordinates
 * using the Google Geocoding API. Biased toward Colorado results.
 *
 * @param apiKey - Google Maps API key
 */
export function createGeocodeTool(apiKey: string) {
  return tool({
    description:
      "Convert a location name to latitude/longitude coordinates. Biased toward Colorado results. Use this tool when you need coordinates for a location name.",
    inputSchema: z.object({
      location: z
        .string()
        .describe(
          "The location to geocode, e.g. 'Berthoud Pass' or 'Rocky Mountain National Park'",
        ),
    }),
    execute: async ({ location }) => {
      const params = new URLSearchParams({
        address: location,
        components: "administrative_area:CO|country:US",
        key: apiKey,
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
      );

      if (!response.ok) {
        return { error: "Unable to find location" };
      }

      const data = (await response.json()) as GoogleGeocodeResponse;

      if (data.status !== "OK" || !data.results?.length) {
        return { error: "Unable to find location" };
      }

      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        displayName: result.formatted_address,
      };
    },
  });
}
