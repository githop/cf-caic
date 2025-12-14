import { createWorkersAI } from "workers-ai-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { OllamaModelName, CFModelName } from "./models";

type OllamaConfig = {
  provider: "ollama";
  modelName: OllamaModelName;
};

type CloudflareConfig = {
  provider: "cloudflare";
  modelName: CFModelName;
  env: Env;
};

export function getModel(config: OllamaConfig): LanguageModel;
export function getModel(config: CloudflareConfig): LanguageModel;
export function getModel(
  config: OllamaConfig | CloudflareConfig
): LanguageModel {
  if (config.provider === "ollama") {
    const ollama = createOpenAICompatible({
      name: "ollama",
      baseURL: "http://localhost:11434/v1",
    });
    return ollama(config.modelName);
  }

  const workersai = createWorkersAI({
    binding: config.env.AI,
    gateway: { id: "caic-gateway" },
  });
  // Cast needed as workers-ai-provider has a strict internal type for model names
  return workersai(config.modelName as Parameters<typeof workersai>[0]);
}
