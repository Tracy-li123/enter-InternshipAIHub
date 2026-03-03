import { useState, useEffect } from "react";
import { InterviewMessage as Message } from "@/hooks/use-ai-interview";
import { User, Bot, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewMessageProps {
  message: Message;
}

export function InterviewMessage({ message }: InterviewMessageProps) {
  const [showThinking, setShowThinking] = useState(true);

  // Auto-collapse thinking when content starts streaming
  useEffect(() => {
    if (message.content && message.thinking) {
      setShowThinking(false);
    }
  }, [message.content, message.thinking]);

  const isWaitingForContent = message.isStreaming && !message.thinking && !message.content;

  return (
    <div className={cn(
      "flex w-full gap-4 px-4 py-6 animate-in fade-in-0 slide-in-from-bottom-2",
      message.role === "user" ? "bg-muted/30" : "bg-background"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        message.role === "user" 
          ? "bg-primary text-primary-foreground" 
          : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
      )}>
        {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        {/* Loading indicator */}
        {isWaitingForContent && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
            </div>
            <span className="text-sm">思考中...</span>
          </div>
        )}

        {/* Thinking section (collapsible) */}
        {message.thinking && (
          <div>
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showThinking ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <span className="font-medium">思考过程</span>
            </button>
            
            {showThinking && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground whitespace-pre-wrap border border-border/50">
                {message.thinking}
                {message.isStreaming && !message.content && (
                  <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        {message.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
