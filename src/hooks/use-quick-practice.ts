import { useState, useCallback } from 'react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';

export interface QuickQuestion {
  id: string;
  question: string;
  category: string;
  framework: string | null;
  referenceAnswer: string;
}

type Rating = 'mastered' | 'needs_practice' | 'skipped';

interface QuickPracticeState {
  questions: QuickQuestion[];
  expandedIds: Set<string>;
  ratings: Record<string, Rating>;
  isAIPM: boolean;
  isBigTech: boolean;
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
}

export function useQuickPractice(
  jobTitle: string,
  jobCategory: string,
  company: string,
  jobDescription: string,
  jobRequirements: string,
) {
  const [state, setState] = useState<QuickPracticeState>({
    questions: [],
    expandedIds: new Set(),
    ratings: {},
    isAIPM: false,
    isBigTech: false,
    isLoading: false,
    error: null,
    isFallback: false,
  });

  const fetchQuestions = useCallback(async (count = 8) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-interview-62325baf28c7`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: 'quick_questions',
          jobTitle,
          jobCategory,
          company,
          jobDescription,
          jobRequirements,
          count,
        }),
      });
      if (!res.ok) throw new Error('生成题目失败，请重试');
      const data = await res.json();
      setState(prev => ({
        ...prev,
        questions: data.questions ?? [],
        isAIPM: data.isAIPM ?? false,
        isBigTech: data.isBigTech ?? false,
        isFallback: !!data.fallback,
        expandedIds: new Set(),
        ratings: {},
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: (err as Error).message }));
    }
  }, [jobTitle, jobCategory, company, jobDescription, jobRequirements]);

  const toggleExpand = useCallback((id: string) => {
    setState(prev => {
      const next = new Set(prev.expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, expandedIds: next };
    });
  }, []);

  const rateQuestion = useCallback((id: string, rating: Rating) => {
    setState(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [id]: rating },
    }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      questions: [],
      expandedIds: new Set(),
      ratings: {},
      error: null,
    }));
  }, []);

  const masteredCount = Object.values(state.ratings).filter(r => r === 'mastered').length;
  const needsPracticeCount = Object.values(state.ratings).filter(r => r === 'needs_practice').length;
  const ratedCount = Object.keys(state.ratings).length;
  const isComplete = state.questions.length > 0 && ratedCount >= state.questions.length;

  return {
    ...state,
    masteredCount,
    needsPracticeCount,
    ratedCount,
    isComplete,
    fetchQuestions,
    toggleExpand,
    rateQuestion,
    reset,
  };
}
