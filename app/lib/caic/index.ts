/**
 * GeoJSON Feature representing a geographic forecast area
 */
interface Feature {
  /** Unique identifier for the geographic feature */
  id: string;
  /** GeoJSON type specification, always "Feature" */
  type: "Feature";
  /** Bounding box in format [minLongitude, minLatitude, maxLongitude, maxLatitude] */
  bbox: [number, number, number, number];
  /** Geometry specification for the area */
  geometry: {
    /** Type of geometry, always MultiPolygon for forecast areas */
    type: "MultiPolygon";
    /** Nested array structure: [polygons][rings][points][coordinates] */
    coordinates: number[][][][];
  };
  /** Additional properties of the feature */
  properties: {
    /** Center point coordinates [longitude, latitude] */
    centroid: number[];
    /** Area identifier matching areaId in forecasts */
    id: string;
  };
}

/**
 * GeoJSON FeatureCollection containing multiple forecast areas
 */
interface FeatureCollection {
  /** Array of individual geographic features */
  features: Feature[];
  /** GeoJSON type specification, always "FeatureCollection" */
  type: "FeatureCollection";
}

interface Image {
  id: string;
  url: string;
  width: number;
  height: number;
  credit?: string;
  caption: string;
  tag: string;
  altText?: string;
  dateTaken?: string | null;
  isArchived: boolean;
}

interface Media {
  Images: Image[];
}

interface Communications {
  headline: string;
  sms: string;
}

interface RegionalDiscussion {
  id: string;
  title: string;
  publicName: string;
  type: "regionaldiscussion";
  polygons: string;
  areaId: string;
  forecaster: string;
  issueDateTime: string;
  expiryDateTime: string;
  isTranslated: boolean;
  message: string;
  communications: Communications;
  media: Media;
}

interface AvalancheProblem {
  type: string;
  aspectElevations: string[];
  likelihood: string;
  expectedSize: { min: string; max: string };
  comment?: string;
}

interface DangerRating {
  position: number;
  alp: string;
  tln: string;
  btl: string;
  date: string;
}

interface AvalancheForecast {
  id: string;
  publicName: string;
  type: "avalancheforecast";
  polygons: string;
  areaId: string;
  forecaster: string;
  issueDateTime: string;
  expiryDateTime: string;
  isTranslated: boolean;
  weatherSummary: { days: { date: string; content: string }[] };
  snowpackSummary: { days: { date: string; content: string }[] };
  avalancheSummary: { days: { date: string; content: string }[] };
  terrainAndTravelAdvice: { days: { date: string; content: string }[][] };
  communication: Communications;
  media: Media;
  dangerRatings: { days: DangerRating[] };
  avalancheProblems: { days: AvalancheProblem[][] };
}

interface SpecialProduct {
  id: string;
  title: string;
  publicName: string;
  type: "specialproduct";
  polygons: string;
  areaId: string;
  forecaster: string;
  issueDateTime: string;
  expiryDateTime: string;
  isTranslated: boolean;
  specialProductType: "warning" | "specialAdvisory";
  startDate?: string;
  message?: string;
  communications: Communications;
  media: Media;
}

type ApiResponse = (RegionalDiscussion | AvalancheForecast | SpecialProduct)[];

/**
 * Product types available from the CAIC API
 */
type ProductType =
  | "avalancheforecast"
  | "regionaldiscussion"
  | "specialproduct";

interface ProductTypeMap {
  avalancheforecast: AvalancheForecast;
  regionaldiscussion: RegionalDiscussion;
  specialproduct: SpecialProduct;
}

/**
 * A product paired with its geographic feature area
 */
interface ProductWithArea<T> {
  product: T;
  area: Feature | undefined;
}

/**
 * CAIC (Colorado Avalanche Information Center) API Client
 *
 * Provides methods to fetch avalanche forecast and geographic region data
 * from the Colorado Avalanche Information Center API.
 *
 * @example
 * ```ts
 * const client = createCAICClient();
 *
 * // Fetch all products
 * const products = await client.getProducts();
 *
 * ```
 */
class CAICClient {
  private readonly baseUrl = "https://avalanche.state.co.us/api-proxy/avid";
  /**
   * Fetch GeoJSON feature data for forecast areas
   *
   * @param productType - The type of product to fetch areas for
   * @param includeExpired - Whether to include expired products (default: true)
   * @returns GeoJSON FeatureCollection containing geographic forecast regions
   */
  async getAreas(
    productType: ProductType,
    includeExpired = true,
  ): Promise<FeatureCollection> {
    const params = new URLSearchParams({
      productType,
      includeExpired: String(includeExpired),
    });

    const url = this.buildUrl(`/products/all/area?${params}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch areas: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<FeatureCollection>;
  }

  /**
   * Fetch all avalanche forecast products
   *
   * @param includeExpired - Whether to include expired products (default: true)
   * @returns Array of forecast products (regional discussions, forecasts, special products)
   */
  async getProducts(includeExpired = true): Promise<ApiResponse> {
    const params = new URLSearchParams({
      includeExpired: String(includeExpired),
    });

    const url = this.buildUrl(`/products/all?${params}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch products: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<ApiResponse>;
  }

  filterByProductType<T extends ProductType>(products: ApiResponse, type: T) {
    return products.filter((p): p is ProductTypeMap[T] => p.type === type);
  }

  // ============================================================
  // Location-based helpers
  // ============================================================

  async fetchForecastForProduct<T extends ProductType>(product: T) {
    const products = await this.getProducts();
    const filtered = this.filterByProductType(products, product);
    return filtered;
  }

  /**
   * Fetch the forecast/product for a given location
   *
   * @param productType - The type of product to fetch
   * @param coords - The coordinates to find the forecast for
   * @returns The matching product or null if the location is not within any area
   *
   * @example
   * ```ts
   * const client = createCAICClient();
   * const forecast = await client.fetchForecastForLocation(
   *   "avalancheforecast",
   *   { lat: 39.6433, lng: -106.3781 } // Vail area
   * );
   * ```
   */
  async fetchForecastForLocation<T extends ProductType>(
    productType: T,
    coords: { lat: number; lng: number },
  ): Promise<ProductTypeMap[T] | null> {
    const { lat, lng } = coords;

    // Fetch areas and products in parallel
    const [areas, products] = await Promise.all([
      this.getAreas(productType),
      this.fetchForecastForProduct(productType),
    ]);

    // Find the area containing the point
    const area = this.findAreaContainingPoint(lat, lng, areas);
    if (!area) {
      return null;
    }

    // Find the product for this area
    const product = products.find((p) => p.areaId === area.properties.id);
    return product ?? null;
  }

  // ============================================================
  // Point-in-polygon helpers
  // ============================================================

  /**
   * Quick bounding box check for early rejection
   * @param lat - Latitude of the point
   * @param lng - Longitude of the point
   * @param bbox - Bounding box [minLng, minLat, maxLng, maxLat]
   */
  private isPointInBbox(
    lat: number,
    lng: number,
    bbox: [number, number, number, number],
  ): boolean {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  }

  /**
   * Ray-casting algorithm to check if a point is inside a polygon ring
   * @param lat - Latitude of the point
   * @param lng - Longitude of the point
   * @param ring - Array of [lng, lat] coordinates forming a closed ring
   */
  private isPointInRing(lat: number, lng: number, ring: number[][]): boolean {
    let inside = false;
    const n = ring.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];

      // Check if the ray from (lng, lat) going right crosses this edge
      if (
        yi > lat !== yj > lat &&
        lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Check if a point is inside a MultiPolygon geometry
   * Handles holes: point must be inside outer ring and outside all hole rings
   * @param lat - Latitude of the point
   * @param lng - Longitude of the point
   * @param coordinates - MultiPolygon coordinates [polygons][rings][points][coords]
   */
  private isPointInMultiPolygon(
    lat: number,
    lng: number,
    coordinates: number[][][][],
  ): boolean {
    for (const polygon of coordinates) {
      // First ring is the outer boundary
      const outerRing = polygon[0];
      if (!this.isPointInRing(lat, lng, outerRing)) {
        continue; // Not in this polygon's outer ring, try next polygon
      }

      // Check if point is inside any hole (rings 1+)
      let inHole = false;
      for (let i = 1; i < polygon.length; i++) {
        if (this.isPointInRing(lat, lng, polygon[i])) {
          inHole = true;
          break;
        }
      }

      if (!inHole) {
        return true; // Inside outer ring and not in any hole
      }
    }

    return false;
  }

  /**
   * Find the area containing the given coordinates
   * @param lat - Latitude of the point
   * @param lng - Longitude of the point
   * @param featureCollection - GeoJSON FeatureCollection to search
   */
  private findAreaContainingPoint(
    lat: number,
    lng: number,
    featureCollection: FeatureCollection,
  ): Feature | null {
    for (const feature of featureCollection.features) {
      // Quick bbox rejection
      if (!this.isPointInBbox(lat, lng, feature.bbox)) {
        continue;
      }

      // Full polygon check
      if (this.isPointInMultiPolygon(lat, lng, feature.geometry.coordinates)) {
        return feature;
      }
    }

    return null;
  }

  /**
   * Build the full URL with the proxied URI parameter
   */
  private buildUrl(path: string): string {
    const encodedPath = encodeURIComponent(path);
    return `${this.baseUrl}?_api_proxy_uri=${encodedPath}`;
  }
}

/**
 * Create a new CAIC API client instance
 */
export function createCAICClient(): CAICClient {
  return new CAICClient();
}

// ============================================================
// Formatter constants and helpers
// ============================================================

const elevationLabels: Record<string, string> = {
  alp: "Alpine",
  tln: "Treeline",
  btl: "Below Treeline",
};

const aspectLabels: Record<string, string> = {
  n: "N",
  ne: "NE",
  e: "E",
  se: "SE",
  s: "S",
  sw: "SW",
  w: "W",
  nw: "NW",
};

const problemTypeLabels: Record<string, string> = {
  persistentSlab: "Persistent Slab",
  windSlab: "Wind Slab",
  looseWet: "Loose Wet",
  looseDry: "Loose Dry",
  stormSlab: "Storm Slab",
  wetSlab: "Wet Slab",
  cornice: "Cornice",
  glide: "Glide",
  deepPersistentSlab: "Deep Persistent Slab",
};

const dangerLabels: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  considerable: "Considerable",
  high: "High",
  extreme: "Extreme",
};

const specialProductTypeLabels: Record<string, string> = {
  warning: "Warning",
  specialAdvisory: "Special Advisory",
};

/**
 * Parse aspect/elevation strings like "n_alp" into readable format
 * Groups by elevation and lists aspects
 */
function formatAspectElevations(aspectElevations: string[]): string {
  const byElevation: Record<string, string[]> = {};

  for (const ae of aspectElevations) {
    const [aspect, elevation] = ae.split("_");
    if (!aspect || !elevation) continue;

    const elevLabel = elevationLabels[elevation] ?? elevation;
    const aspectLabel = aspectLabels[aspect] ?? aspect.toUpperCase();

    if (!byElevation[elevLabel]) {
      byElevation[elevLabel] = [];
    }
    byElevation[elevLabel].push(aspectLabel);
  }

  return Object.entries(byElevation)
    .map(([elev, aspects]) => `${aspects.join(", ")} @ ${elev}`)
    .join("; ");
}

/**
 * Format day summaries (avalanche, snowpack, weather)
 */
function formatDaySummaries(days: { date: string; content: string }[]): string {
  if (!days.length) return "";

  return days.map((day) => `### ${day.date}\n${day.content}`).join("\n\n");
}

/**
 * Format danger ratings, skipping noRating entries
 */
function formatDangerRatings(days: DangerRating[]): string {
  const validDays = days.filter(
    (day) =>
      day.alp !== "noRating" ||
      day.tln !== "noRating" ||
      day.btl !== "noRating",
  );

  if (!validDays.length) return "";

  return validDays
    .map((day) => {
      const lines = [`### ${day.date}`];
      if (day.alp !== "noRating") {
        lines.push(`- Alpine: ${dangerLabels[day.alp] ?? day.alp}`);
      }
      if (day.tln !== "noRating") {
        lines.push(`- Treeline: ${dangerLabels[day.tln] ?? day.tln}`);
      }
      if (day.btl !== "noRating") {
        lines.push(`- Below Treeline: ${dangerLabels[day.btl] ?? day.btl}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

/**
 * Format avalanche problems by day
 */
function formatAvalancheProblems(days: AvalancheProblem[][]): string {
  const nonEmptyDays = days
    .map((problems, index) => ({ problems, index }))
    .filter(({ problems }) => problems.length > 0);

  if (!nonEmptyDays.length) return "";

  return nonEmptyDays
    .map(({ problems, index }) => {
      const dayHeader = `### Day ${index + 1}`;
      const problemsFormatted = problems
        .map((problem) => {
          const typeLabel = problemTypeLabels[problem.type] ?? problem.type;
          const lines = [
            `#### ${typeLabel}`,
            `- Likelihood: ${problem.likelihood}`,
            `- Expected Size: ${problem.expectedSize.min} - ${problem.expectedSize.max}`,
            `- Aspects/Elevations: ${formatAspectElevations(problem.aspectElevations)}`,
          ];
          if (problem.comment) {
            lines.push(`- Details: ${problem.comment}`);
          }
          return lines.join("\n");
        })
        .join("\n\n");

      return `${dayHeader}\n${problemsFormatted}`;
    })
    .join("\n\n");
}

/**
 * Format an AvalancheForecast into a readable string for tool responses
 *
 * @param forecast - The AvalancheForecast to format
 * @returns Formatted markdown string
 */
export function formatAvalancheForecast(forecast: AvalancheForecast): string {
  const sections: string[] = [];

  // Header
  sections.push(`# Avalanche Forecast`);
  sections.push(`Issued: ${forecast.issueDateTime}`);

  // Danger Ratings
  const dangerRatings = formatDangerRatings(forecast.dangerRatings.days);
  if (dangerRatings) {
    sections.push(`## Danger Ratings\n${dangerRatings}`);
  }

  // Avalanche Summary
  const avalancheSummary = formatDaySummaries(forecast.avalancheSummary.days);
  if (avalancheSummary) {
    sections.push(`## Avalanche Summary\n${avalancheSummary}`);
  }

  // Avalanche Problems
  const avalancheProblems = formatAvalancheProblems(
    forecast.avalancheProblems.days,
  );
  if (avalancheProblems) {
    sections.push(`## Avalanche Problems\n${avalancheProblems}`);
  }

  // Snowpack Summary
  const snowpackSummary = formatDaySummaries(forecast.snowpackSummary.days);
  if (snowpackSummary) {
    sections.push(`## Snowpack Summary\n${snowpackSummary}`);
  }

  // Weather Summary
  const weatherSummary = formatDaySummaries(forecast.weatherSummary.days);
  if (weatherSummary) {
    sections.push(`## Weather Summary\n${weatherSummary}`);
  }

  // Terrain and Travel Advice (flatten the nested array)
  const flattenedAdvice = forecast.terrainAndTravelAdvice.days.flat();
  const travelAdvice = formatDaySummaries(flattenedAdvice);
  if (travelAdvice) {
    sections.push(`## Terrain and Travel Advice\n${travelAdvice}`);
  }

  return sections.join("\n\n");
}

/**
 * Format a RegionalDiscussion into a readable string for tool responses
 *
 * @param discussion - The RegionalDiscussion to format
 * @returns Formatted markdown string
 */
export function formatRegionalDiscussion(
  discussion: RegionalDiscussion,
): string {
  const sections: string[] = [];

  sections.push(`# Regional Discussion: ${discussion.title}`);
  sections.push(`Issued: ${discussion.issueDateTime}`);
  sections.push(discussion.message);

  return sections.join("\n\n");
}

/**
 * Format a SpecialProduct into a readable string for tool responses
 *
 * @param product - The SpecialProduct to format
 * @returns Formatted markdown string
 */
export function formatSpecialProduct(product: SpecialProduct): string {
  const sections: string[] = [];

  sections.push(`# Special Product: ${product.title}`);

  const typeLabel =
    specialProductTypeLabels[product.specialProductType] ??
    product.specialProductType;
  sections.push(`Type: ${typeLabel}`);
  sections.push(`Issued: ${product.issueDateTime}`);

  if (product.startDate) {
    sections.push(`Start Date: ${product.startDate}`);
  }

  if (product.message) {
    sections.push(product.message);
  }

  return sections.join("\n\n");
}

// Export types for external use
export type {
  Feature,
  FeatureCollection,
  Image,
  Media,
  Communications,
  RegionalDiscussion,
  AvalancheProblem,
  DangerRating,
  AvalancheForecast,
  SpecialProduct,
  ApiResponse,
  ProductType,
  ProductWithArea,
};

export { CAICClient };
