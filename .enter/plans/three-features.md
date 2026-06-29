# Plan: Non-Technical Interview Coach Integration

## Context
Integrate the GitHub skill `Tracy-li123/non-technical-interview-coach` into the existing AI interview feature. The skill provides a structured question bank, answer frameworks (STAR+, User-Problem-Solution-Tradeoff), and a 1-5 evaluation rubric for product manager roles.

**Key constraint**: The Python CLI scripts (`interview_coach_cli.py`, `deepseek_helper.py`) cannot run in a browser or Deno edge function. All logic will be ported to TypeScript/Deno natively. The skill's *content* (question bank, frameworks, rubrics) is what gets integrated.

## What Changes

### 3 New Interview Modes

| Mode | AI? | Description |
|------|-----|-------------|
| 快速练习 | No | Questions from embedded bank, user self-rates |
| AI 面试官 | DeepSeek | Streaming interview with score/feedback per answer |
| 简历准备 | DeepSeek | Upload resume.docx + JD.docx → personalized prep plan |

Current "学习模式" → becomes the mode-selection landing screen.
Current "模拟面试" → becomes "AI 面试官" mode with enhancements.

---

## Files to Create/Modify

### New files
- `src/components/interview/InterviewSetup.tsx` — Mode selection screen (3 cards with descriptions)
- `src/components/interview/QuickPracticeMode.tsx` — Question-by-question practice, no AI
- `src/components/interview/PrepMode.tsx` — Word file upload + streaming prep plan display
- `src/lib/pm-question-bank.ts` — Embedded question bank from GitHub (categorized, tagged by role/company)
- `src/hooks/use-quick-practice.ts` — Hook for question fetching + progress tracking
- `src/hooks/use-interview-prep.ts` — Hook for resume+JD prep (streaming)

### Modified files
- `src/pages/interview/[jobId].tsx` — Replace 2-mode tabs with 3-mode state machine
- `src/components/interview/StudyMode.tsx` — Repurpose as InterviewSetup (or replace entirely)
- `src/hooks/use-ai-interview.ts` — No changes needed (AI mock stays the same)
- `supabase/functions/ai-interview-62325baf28c7/index.ts` — Add `mode: 'questions'` and `mode: 'prep'` handlers

### New dependency
- `mammoth` — parse .docx files client-side (extract text before sending to edge function)

---

## Implementation Details

### 1. `src/lib/pm-question-bank.ts`
Embed the full question bank from GitHub as a typed TS object:
```ts
export interface Question {
  id: string;
  category: string;       // "opening" | "project" | "product_sense" | "data" | ...
  text: string;
  source: string;         // "[AI-PM-BANK]" | "[AWESOME-PM]" | "[GENERAL-PM]"
  tags: string[];         // ["腾讯", "ai_pm", "campus"] etc.
  framework?: string;     // suggested answer framework
}

export const PM_QUESTIONS: Question[] = [ /* ~80 questions from GitHub bank */ ];

export function filterQuestions(opts: {
  role: string;
  company?: string;
  count?: number;
  categories?: string[];
}): Question[]
```

Filtering rules (from SKILL.md):
- AI PM roles: prioritize `ai_product`, `agent`, `model_selection`, `evaluation` categories
- 腾讯/大厂: prioritize product critique, metrics, prioritization, cross-functional

### 2. Edge Function — New Modes
Add two new `mode` branches before the existing streaming logic:

**`mode: 'questions'`** (no AI, JSON response):
```ts
if (mode === 'questions') {
  const qs = filterQuestions({ role, company, count: count ?? 8 });
  return new Response(JSON.stringify({ questions: qs }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

**`mode: 'prep'`** (streaming DeepSeek):
System prompt built from:
- Role + company
- Resume text (extracted from Word by frontend)
- JD text (extracted from Word by frontend)
- Output format: JD signal map → resume evidence map → gap risks → likely questions → story bank → priority drills

Keep existing `mode: 'mock'` (default) unchanged.

### 3. Frontend State Machine (`interview/[jobId].tsx`)
```
InterviewPage state:
  'setup'          → InterviewSetup component (mode selection)
  'quick'          → QuickPracticeMode component
  'ai_mock'        → existing chat UI (useAIInterview hook)
  'prep'           → PrepMode component
```

**InterviewSetup** shows 3 cards:
- **快速练习**: "不调用AI，速度快，适合刷题熟悉题型" → button starts quick mode
- **AI 面试官**: "DeepSeek精准反馈，适合正式面试前模拟" → button starts AI mock
- **简历+JD准备**: "上传简历和JD，生成个性化准备方案" → button goes to prep mode

For PM roles: show badge "产品经理专属题库 已启用"

### 4. QuickPracticeMode
- Fetches questions from edge function (`mode: 'questions'`)
- Shows 1 question at a time with progress bar (e.g. 3/8)
- User clicks "查看参考框架" to expand answer hint (STAR+, etc.)
- Self-rate buttons: "掌握", "需要练习", "跳过"
- End: show summary (X/Y mastered, list of "需要练习" questions)

### 5. PrepMode
- Two file dropzones: resume (.docx) and JD (.docx)
- On upload: use `mammoth.extractRawText()` to get plain text client-side
- Shows text preview (first 200 chars) for confirmation
- "生成准备方案" button → streams result from edge function
- Output sections rendered as the stream arrives:
  1. JD Signal Map
  2. Resume Evidence Map
  3. Gap Risks
  4. Likely Questions
  5. Story Bank
  6. Priority Drills

### 6. AI Mock Interview Enhancements
Update `buildPMSystemPrompt()` in the edge function to:
- Include the evaluation rubric format (Score: X/5, Strong signal, Weak signal, Rewrite, Follow-up drill)
- Reference question category priorities by role/company
- Keep existing "一次只问一个问题" rule
- Model: keep `deepseek-reasoner` for PM, `deepseek-chat` for general

---

## PM Role Priority Logic
Reuse existing `isPMRole()` and `isAIPMRole()` functions in edge function. On frontend, detect PM role from `job.category.name` or `job.title` and:
- Show "产品经理专属题库" badge in setup screen
- Pre-filter quick practice to PM categories by default
- AI mock uses enhanced PM system prompt (existing)

---

## Verification
1. Navigate to any PM job → Interview page → See 3-mode setup screen
2. Quick Practice: questions appear one-by-one, no network AI call
3. AI Interviewer: chat works, feedback follows Score/Strong/Weak/Rewrite/Follow-up format
4. Prep: upload .docx files → text extracted → streaming prep plan appears
5. AI PM job → quick practice shows AI-specific questions (RAG, Agent, etc.)
6. 腾讯 job → questions weighted toward product critique, metrics
