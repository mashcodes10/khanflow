"use client";

import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";
import { voiceAPI } from "@/lib/api";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: {
    audioFileName?: string;
    parsedData?: any;
  };
}

export interface ConversationPanelProps {
  conversationId: string;
  className?: string;
}

export function ConversationPanel({
  conversationId,
  className,
}: ConversationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch conversation data
  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => voiceAPI.getConversationV2(conversationId),
    enabled: !!conversationId,
    refetchInterval: 3000, // Refetch every 3 seconds to get updates
  });

  const messages = conversation?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <Card className={cn(
      "flex flex-col border-border-subtle bg-card shadow-sm rounded-2xl overflow-hidden",
      className
    )}>
      <CardHeader className="pb-3 pt-5 px-6">
        <CardTitle className="text-lg flex items-center gap-2 font-semibold text-foreground">
          <Bot className="h-5 w-5" />
          Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-full px-6 pb-4" style={{ maxHeight: '400px' }}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Start speaking to begin a conversation</p>
                </div>
              ) : (
                messages.map((message) => (
                  <ConversationMessageItem key={message.id} message={message} />
                ))
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}
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
          {new Date(message.createdAt).toLocaleTimeString([], {
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
