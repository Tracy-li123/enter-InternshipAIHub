import { useState, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  isStreaming?: boolean;
}

const FALLBACK_MESSAGES: Record<string, string> = {
  authentication_error: "认证失败，请刷新页面重试",
  rate_limit_error: "请求过于频繁，请稍后再试",
  invalid_request_error: "请求无效，请重试",
  overloaded_error: "服务繁忙，请稍后再试",
  insufficient_credits: "AI 额度已用完，请联系网站管理员",
  permission_error: "AI 功能已被禁用，请联系网站管理员",
  api_error: "服务暂时不可用",
};

function getUserErrorMessage(code: string, backendMessage: string): string {
  if (backendMessage) return backendMessage;
  return FALLBACK_MESSAGES[code] || "服务暂时不可用";
}

export function useAIInterview(jobDescription: string) {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    abortControllerRef.current = new AbortController();

    const userMessage: InterviewMessage = { role: "user", content };
    const assistantMessage: InterviewMessage = {
      role: "assistant",
      content: "",
      thinking: "",
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    // Accumulate content across chunks
    let thinkingAcc = "";
    let contentAcc = "";

    try {
      await fetchEventSource(`${SUPABASE_URL}/functions/v1/ai-interview-62325baf28c7`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          jobDescription,
        }),
        signal: abortControllerRef.current.signal,

        async onopen(response) {
          if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
              const errorData = await response.json();
              throw new Error(errorData.error?.message || `请求失败: ${response.status}`);
            }
            throw new Error(`请求失败: ${response.status}`);
          }
        },

        onmessage(event) {
          if (!event.data) return;

          // DeepSeek/OpenAI stream end signal
          if (event.data === "[DONE]") {
            setMessages(prev => updateLastAssistant(prev, { isStreaming: false }));
            setIsLoading(false);
            return;
          }

          try {
            const data = JSON.parse(event.data);

            // Edge function error event
            if (data.type === "error") {
              const errorMsg = getUserErrorMessage(
                data.error?.type || "api_error",
                data.error?.message || "服务错误"
              );
              setError(errorMsg);
              setMessages(prev => prev.slice(0, -1));
              setIsLoading(false);
              return;
            }

            const delta = data.choices?.[0]?.delta;
            if (!delta) return;

            // DeepSeek-R1 reasoning / thinking content
            if (delta.reasoning_content) {
              thinkingAcc += delta.reasoning_content;
              setMessages(prev => updateLastAssistant(prev, { thinking: thinkingAcc }));
            }

            // Main response content
            if (delta.content) {
              contentAcc += delta.content;
              setMessages(prev => updateLastAssistant(prev, { content: contentAcc }));
            }

            // Finish signal via finish_reason
            if (data.choices?.[0]?.finish_reason === "stop") {
              setMessages(prev => updateLastAssistant(prev, { isStreaming: false }));
              setIsLoading(false);
            }
          } catch {
            // Ignore malformed chunks
          }
        },

        onerror(err) {
          throw err;
        },
      });
    } catch (err) {
      const error = err as Error;
      if (error.name !== "AbortError") {
        setError(error.message || "发送消息失败");
        setMessages(prev => prev.slice(0, -1));
      }
      setIsLoading(false);
    }
  }, [messages, jobDescription]);

  const startInterview = useCallback(() => {
    sendMessage("你好，我准备好开始面试了。");
  }, [sendMessage]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { messages, isLoading, error, sendMessage, startInterview, cancel };
}

function updateLastAssistant(
  messages: InterviewMessage[],
  updates: Partial<InterviewMessage>
): InterviewMessage[] {
  const updated = [...messages];
  const last = updated[updated.length - 1];
  if (last?.role === "assistant") {
    Object.assign(last, updates);
  }
  return updated;
}
