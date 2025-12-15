import type { Route } from "./+types/api.chat";
import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { getModel } from "../lib/ai/ai";
import { OLLAMA_MODELS, CF_MODELS } from "../lib/ai/models";
import { createGeocodeTool, createAvalancheInfoTool } from "../lib/tools";
import { createCAICClient } from "../lib/caic";

export async function action({ request, context }: Route.ActionArgs) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const model = import.meta.env.DEV
    ? getModel({ provider: "ollama", modelName: OLLAMA_MODELS.QWEN })
    : getModel({
        provider: "cloudflare",
        modelName: CF_MODELS.QWEN,
        env: context.cloudflare.env,
      });

  const caicClient = createCAICClient();

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(9),
    tools: {
      geocode: createGeocodeTool(context.cloudflare.env.GOOGLE_MAPS_API_KEY),
      getAvalancheInfo: createAvalancheInfoTool(caicClient),
    },
  });

  return result.toUIMessageStreamResponse();
}
