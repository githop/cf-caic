import type { InferUITools, UIMessage, ToolUIPart, UIMessagePart, UIDataTypes } from "ai";
import type { createAvalancheInfoTool } from "./avalanche-info";
import type { createGeocodeTool } from "./geocode";
export { createGeocodeTool } from "./geocode";
export { createAvalancheInfoTool } from "./avalanche-info";

type GeoCodeToolReturn = ReturnType<typeof createGeocodeTool>;
type AvalancheInfoToolReturn = ReturnType<typeof createAvalancheInfoTool>;

export type Tools = {
  geocode: GeoCodeToolReturn;
  getAvalancheInfo: AvalancheInfoToolReturn;
};

export type CaicTools = InferUITools<Tools>;
export type CaicUiMessage = UIMessage<unknown, {}, CaicTools>;
export type CaicToolPart = ToolUIPart<CaicTools>;

export function isCaicToolPart(
  part: UIMessagePart<UIDataTypes, CaicTools>
): part is CaicToolPart {
  return part.type === "tool-geocode" || part.type === "tool-getAvalancheInfo";
}
