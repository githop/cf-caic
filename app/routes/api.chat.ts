import type { Route } from "./+types/api.chat";
import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { getModel } from "../lib/ai/ai";
import { OLLAMA_MODELS, CF_MODELS } from "../lib/ai/models";

export async function action({ request, context }: Route.ActionArgs) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const model = import.meta.env.DEV
    ? getModel({ provider: "ollama", modelName: OLLAMA_MODELS.QWEN })
    : getModel({
        provider: "cloudflare",
        modelName: CF_MODELS.QWEN,
        env: context.cloudflare.env,
      });

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
