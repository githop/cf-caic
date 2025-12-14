export const OLLAMA_MODELS = {
  LLAMA: "llama3.2:3b-instruct-fp16-num_ctx-32k",
  GEMMA: "gemma3:4b-it-fp16-num_ctx-32k",
  QWEN: "qwen3:4b-thinking-2507-fp16",
} as const;

export const CF_MODELS = {
  QWEN: "@cf/qwen/qwen3-30b-a3b-fp8",
} as const;

export const Models = { ...CF_MODELS, ...OLLAMA_MODELS } as const;

export type OllamaModelName =
  (typeof OLLAMA_MODELS)[keyof typeof OLLAMA_MODELS];
export type CFModelName = (typeof CF_MODELS)[keyof typeof CF_MODELS];
export type ModelName = OllamaModelName | CFModelName;
