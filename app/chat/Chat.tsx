"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
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
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";

interface Props {
  welcomeMessage?: string;
}

export function Chat({ welcomeMessage }: Props) {
  const { messages, sendMessage, status } = useChat({
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

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CAIC Chat</h1>
      {welcomeMessage && <h2 className="mb-4">{welcomeMessage}</h2>}

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  // Handle text parts
                  if (part.type === "text") {
                    return (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    );
                  }

                  // Handle tool call parts (type starts with "tool-")
                  if (
                    part.type.startsWith("tool-") &&
                    "state" in part &&
                    "input" in part
                  ) {
                    return (
                      <Tool
                        key={index}
                        defaultOpen={part.state === "output-available"}
                      >
                        <ToolHeader
                          type={part.type as `tool-${string}`}
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

      <PromptInput onSubmit={handleSubmit} className="mt-4">
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputSubmit status={status} disabled={!input.trim()} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
