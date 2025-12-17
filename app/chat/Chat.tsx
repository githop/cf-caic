"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import type { CaicUiMessage } from "~/lib/tools";
import { isCaicToolPart } from "~/lib/tools";
import { Suggestion, Suggestions } from "~/components/ai-elements/suggestion";
import { ModeToggle } from "@/components/mode-toggle";

interface Props {
  welcomeMessage?: string;
}

const suggestions = [
  "What's the avalanche forecast for Berthoud Pass?",
  "What's the regional discussion for Rocky Mountain NP?",
];

export function Chat({ welcomeMessage }: Props) {
  const { messages, sendMessage, status } = useChat<CaicUiMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground">
      <header className="flex-none border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-3xl mx-auto items-center justify-between px-4">
          <div className="font-semibold">CAIC Chat</div>
          <ModeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full max-w-3xl mx-auto p-4">
          {hasMessages ? (
            <Conversation className="flex-1">
              <ConversationContent>
                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, index) => {
                        // Handle text parts
                        if (part.type === "text") {
                          return (
                            <MessageResponse key={index}>
                              {part.text}
                            </MessageResponse>
                          );
                        }

                        if (isCaicToolPart(part)) {
                          return (
                            <Tool
                              key={index}
                              defaultOpen={part.state === "output-available"}
                            >
                              <ToolHeader
                                type={part.type}
                                state={part.state}
                                title={part.type.replace("tool-", "")}
                              />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput
                                  tool={part.type}
                                  output={part.output}
                                  errorText={part.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        }

                        return null;
                      })}
                    </MessageContent>
                  </Message>
                ))}
                {status === "submitted" && <Loader />}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center px-4">
              <div className="max-w-lg space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome to CAIC Chat
                </h1>

                <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
                  <div className="flex items-start gap-3 text-left">
                    <TriangleAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium">
                        This is a side project for educational purposes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Information provided here may not be accurate. Always
                        verify avalanche forecasts and conditions with the
                        official CAIC site.
                      </p>

                      <p className="text-sm text-muted-foreground">
                        What is CAIC? The Colorado Avalanche Information Center
                        provides forecasts and reports for backcountry
                        recreators. Visit their official site at{" "}
                        <a
                          href="https://avalanche.state.co.us/"
                          target="_blank"
                          rel="noopener"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          https://avalanche.state.co.us/
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md">
                <Suggestions>
                  {suggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      onClick={() => {
                        sendMessage({ text: suggestion });
                      }}
                      suggestion={suggestion}
                    />
                  ))}
                </Suggestions>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex-none pt-4">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about avalanche conditions..."
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputSubmit status={status} disabled={!input.trim()} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
