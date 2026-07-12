import { useState, useCallback, useRef } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

export interface PersonalizedQuestion {
  id: string;
  question: string;
  reason: string;
  framework: string | null;
  referenceAnswer: string;
}

export interface FollowupMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface JobContext {
  jobTitle: string;
  jobCategory: string;
  company: string;
  jobDescription: string;
  jobRequirements: string;
}

export function usePersonalizedQuestions(ctx: JobContext) {
  const [questions, setQuestions] = useState<PersonalizedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Per-question follow-up conversation state
  const [followups, setFollowups] = useState<Record<string, FollowupMessage[]>>({});
  const [followupLoading, setFollowupLoading] = useState<Record<string, boolean>>({});
  const abortRefs = useRef<Record<string, AbortController>>({});

  const generateQuestions = useCallback(async (resumeText: string, count = 6) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-interview-62325baf28c7`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: 'personalized_questions',
          jobTitle: ctx.jobTitle,
          jobCategory: ctx.jobCategory,
          company: ctx.company,
          jobDescription: ctx.jobDescription,
          jobRequirements: ctx.jobRequirements,
          resumeText,
          count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败，请重试');
      setQuestions(data.questions ?? []);
      setFollowups({});
      setHasGenerated(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [ctx.jobTitle, ctx.jobCategory, ctx.company, ctx.jobDescription, ctx.jobRequirements]);

  const sendFollowup = useCallback(async (questionId: string, content: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    abortRefs.current[questionId]?.abort();
    const controller = new AbortController();
    abortRefs.current[questionId] = controller;

    const userMsg: FollowupMessage = { role: 'user', content };
    const assistantMsg: FollowupMessage = { role: 'assistant', content: '', isStreaming: true };

    setFollowups(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] ?? []), userMsg, assistantMsg],
    }));
    setFollowupLoading(prev => ({ ...prev, [questionId]: true }));

    let acc = '';
    const priorMessages = (followups[questionId] ?? []).map(m => ({ role: m.role, content: m.content }));

    const updateAssistant = (updates: Partial<FollowupMessage>) => {
      setFollowups(prev => {
        const list = [...(prev[questionId] ?? [])];
        const last = list[list.length - 1];
        if (last?.role === 'assistant') Object.assign(last, updates);
        return { ...prev, [questionId]: list };
      });
    };

    try {
      await fetchEventSource(`${SUPABASE_URL}/functions/v1/ai-interview-62325baf28c7`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: 'followup',
          jobTitle: ctx.jobTitle,
          company: ctx.company,
          question: question.question,
          referenceAnswer: question.referenceAnswer,
          messages: [...priorMessages, { role: 'user', content }],
        }),
        signal: controller.signal,

        async onopen(response) {
          if (!response.ok) {
            const ct = response.headers.get('content-type');
            if (ct?.includes('application/json')) {
              const err = await response.json();
              throw new Error(err.error?.message || '请求失败');
            }
            throw new Error(`请求失败: ${response.status}`);
          }
        },

        onmessage(event) {
          if (!event.data || event.data === '[DONE]') {
            if (event.data === '[DONE]') {
              updateAssistant({ isStreaming: false });
              setFollowupLoading(prev => ({ ...prev, [questionId]: false }));
            }
            return;
          }
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'error') {
              updateAssistant({ content: data.error?.message || '出错了', isStreaming: false });
              setFollowupLoading(prev => ({ ...prev, [questionId]: false }));
              return;
            }
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              updateAssistant({ content: acc });
            }
            if (data.choices?.[0]?.finish_reason === 'stop') {
              updateAssistant({ isStreaming: false });
              setFollowupLoading(prev => ({ ...prev, [questionId]: false }));
            }
          } catch {
            // ignore malformed chunks
          }
        },

        onerror(err) {
          throw err;
        },
      });
    } catch (err) {
      const e = err as Error;
      if (e.name !== 'AbortError') {
        updateAssistant({ content: e.message || '追问失败，请重试', isStreaming: false });
      }
      setFollowupLoading(prev => ({ ...prev, [questionId]: false }));
    }
  }, [questions, followups, ctx.jobTitle, ctx.company]);

  const reset = useCallback(() => {
    Object.values(abortRefs.current).forEach(c => c.abort());
    setQuestions([]);
    setFollowups({});
    setFollowupLoading({});
    setError(null);
    setHasGenerated(false);
  }, []);

  return {
    questions,
    isLoading,
    error,
    hasGenerated,
    followups,
    followupLoading,
    generateQuestions,
    sendFollowup,
    reset,
  };
}
