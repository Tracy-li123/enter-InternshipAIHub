import { useState, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

export function useInterviewPrep(jobTitle: string, jobCategory: string, company: string) {
  const [prepContent, setPrepContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generatePrep = useCallback(async (resumeText: string, jdText: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setPrepContent('');
    setIsLoading(true);
    setError(null);

    let acc = '';

    try {
      await fetchEventSource(`${SUPABASE_URL}/functions/v1/ai-interview-62325baf28c7`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: 'prep',
          jobTitle,
          jobCategory,
          company,
          resumeText,
          jdText,
        }),
        signal: abortRef.current.signal,

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
            if (event.data === '[DONE]') setIsLoading(false);
            return;
          }
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'error') {
              setError(data.error?.message || '生成失败');
              setIsLoading(false);
              return;
            }
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              acc += content;
              setPrepContent(acc);
            }
            if (data.choices?.[0]?.finish_reason === 'stop') {
              setIsLoading(false);
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
        setError(e.message || '生成准备方案失败');
      }
      setIsLoading(false);
    }
  }, [jobTitle, jobCategory, company]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPrepContent('');
    setIsLoading(false);
    setError(null);
  }, []);

  return { prepContent, isLoading, error, generatePrep, cancel, reset };
}
