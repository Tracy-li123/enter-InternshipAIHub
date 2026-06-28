# Plan: Three Feature Additions

## 1. Restore Deleted Jobs

**Problem**: `JobCard` shows deleted jobs in the list (via `showDeleted`) but only shows delete button. No way to restore from the card.

**Changes**:
- `src/components/job/JobCard.tsx`: Import `useRestoreJob`. When `job.deleted_at` is not null, show `RotateCcw` restore button in footer instead of normal (apply / external link) buttons. Hide bookmark and delete icons too. Card gets slight opacity/muted styling.

No DB changes needed (soft-delete already works).

---

## 2. Job Description Rendering + Requirements Extraction

**Problem**: Description is raw text with `whitespace-pre-wrap`. No structured rendering. No requirements field.

**DB Migration**: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT;`

**Edge function** (`import-job-from-url`): Update AI prompt to extract `description` + `requirements` as separate fields. Return both and save to DB.

**New component** `src/components/job/JobDescriptionRenderer.tsx`:
- Parse text into tokens: headings (`# ##`), bold (`**`), bullet lists (`-` / `*`), numbered lists (`1.`), paragraphs
- Render as styled HTML elements (no extra library needed)

**`src/pages/job/[jobId].tsx`**:
- Use `JobDescriptionRenderer` for both description and requirements
- Show two separate cards: "岗位描述" and "岗位要求" (hide requirements card if empty)

---

## 3. PM Interview Skill (non-technical-interview-coach)

**PM role detection**: Check job title/category against list:
> 产品经理, AI产品经理, 产品运营, 产品策划, 增长产品, 数据产品, B端产品, C端产品, 策略产品, 用户研究

**Edge function** (`ai-interview-62325baf28c7`): Accept `jobTitle`, `jobCategory` in addition to `messages`/`jobDescription`. When PM role detected, replace system prompt with PM coach prompt that embeds:
- Mock Interview Protocol (one question at a time, score after each answer)
- Role playbook excerpt (PM vs AI PM)
- Key question categories from question bank
- Answer frameworks (STAR+, User-Problem-Solution-Tradeoff)

**`src/hooks/use-ai-interview.ts`**: Add `jobTitle`, `jobCategory` params.

**`src/pages/interview/[jobId].tsx`**: Pass `job.title` and `job.category?.name` to `useAIInterview`.

**No new dependency** — skill content embedded as string in edge function.
