import { useState, useCallback } from 'react';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { Question } from '@/lib/pm-question-bank';

interface QuickPracticeState {
  questions: Question[];
  currentIndex: number;
  ratings: Record<string, 'mastered' | 'needs_practice' | 'skipped'>;
  isAIPM: boolean;
  isBigTech: boolean;
  isLoading: boolean;
  error: string | null;
  isShowingHint: boolean;
}

export function useQuickPractice(jobTitle: string, jobCategory: string, company: string) {
  const [state, setState] = useState<QuickPracticeState>({
    questions: [],
    currentIndex: 0,
    ratings: {},
    isAIPM: false,
    isBigTech: false,
    isLoading: false,
    error: null,
    isShowingHint: false,
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
          mode: 'questions',
          jobTitle,
          jobCategory,
          company,
          count,
        }),
      });
      if (!res.ok) throw new Error('获取题目失败');
      const data = await res.json();
      setState(prev => ({
        ...prev,
        questions: data.questions ?? [],
        isAIPM: data.isAIPM ?? false,
        isBigTech: data.isBigTech ?? false,
        currentIndex: 0,
        ratings: {},
        isLoading: false,
        isShowingHint: false,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: (err as Error).message }));
    }
  }, [jobTitle, jobCategory, company]);

  const rateQuestion = useCallback((id: string, rating: 'mastered' | 'needs_practice' | 'skipped') => {
    setState(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [id]: rating },
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length),
      isShowingHint: false,
    }));
  }, []);

  const toggleHint = useCallback(() => {
    setState(prev => ({ ...prev, isShowingHint: !prev.isShowingHint }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: 0,
      ratings: {},
      isShowingHint: false,
    }));
  }, []);

  const currentQuestion = state.questions[state.currentIndex] ?? null;
  const isComplete = state.questions.length > 0 && state.currentIndex >= state.questions.length;
  const masteredCount = Object.values(state.ratings).filter(r => r === 'mastered').length;
  const needsPracticeCount = Object.values(state.ratings).filter(r => r === 'needs_practice').length;

  return {
    ...state,
    currentQuestion,
    isComplete,
    masteredCount,
    needsPracticeCount,
    fetchQuestions,
    rateQuestion,
    toggleHint,
    reset,
  };
}
