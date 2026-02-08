"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    audioFileName?: string;
    parsedData?: any;
  };
}

export interface ConversationPanelProps {
  messages: ConversationMessage[];
  isProcessing?: boolean;
  className?: string;
}

export function ConversationPanel({
  messages,
  isProcessing = false,
  className,
}: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Start speaking to begin a conversation</p>
              </div>
            ) : (
              messages.map((message) => (
                <ConversationMessageItem key={message.id} message={message} />
              ))
            )}

            {isProcessing && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2 max-w-[80%]">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="animate-bounce delay-0 inline-block h-2 w-2 rounded-full bg-primary"></span>
                        <span className="animate-bounce delay-100 inline-block h-2 w-2 rounded-full bg-primary"></span>
                        <span className="animate-bounce delay-200 inline-block h-2 w-2 rounded-full bg-primary"></span>
                      </div>
                      <span className="text-sm text-muted-foreground">Processing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ConversationMessageItem({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex items-start gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className={isUser ? "bg-blue-100" : "bg-primary/10"}>
          {isUser ? (
            <User className="h-4 w-4 text-blue-600" />
          ) : (
            <Bot className="h-4 w-4 text-primary" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex-1 space-y-2 max-w-[80%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-lg px-4 py-3 break-words",
            isUser ? "bg-blue-600 text-white" : "bg-muted text-foreground"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// Add CSS for animation delays
const style = document.createElement("style");
style.textContent = `
  .delay-0 { animation-delay: 0ms; }
  .delay-100 { animation-delay: 100ms; }
  .delay-200 { animation-delay: 200ms; }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(style);
}
