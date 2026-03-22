# Plan: Fix Bookmarks, Add Delete Buttons, and Enhance Web Scraping

## Context
This plan addresses three critical issues identified by the user:

1. **Bookmarked jobs disappearing**: Jobs disappear from the homepage when bookmarked because bookmark is currently implemented as a status (mutually exclusive with delivery status)
2. **Delete button placement**: Delete buttons only appear in job detail page, not in the job list view
3. **Web search for job scraping**: Current scraping only works with direct URLs; need to add ability to search company websites for job postings

## Root Cause Analysis

### Issue 1: Bookmark System Design Flaw
- `bookmarked` is currently a `JobStatus` value, not a separate field
- When a job is bookmarked, its status changes to 'bookmarked', replacing delivery status
- Home page filters OUT bookmarked jobs (line 83-86 in `src/pages/home/index.tsx`)
- `useAppliedJobs` excludes bookmarked jobs (line 96 in `src/hooks/use-jobs.ts`)
- Result: Bookmarked jobs vanish from main list and bookmark count shows 0

### Issue 2: UI Limitation
- Delete functionality only in `src/pages/job/[jobId].tsx`
- `JobCard` component lacks delete button
- Users must navigate to detail page to delete jobs

### Issue 3: Limited Scraping Capability
- Current `import-job-from-url` requires exact job posting URL
- Cannot search company career pages
- No ability to discover jobs automatically

## Detailed Implementation Plan

### Phase 1: Fix Bookmark System (Database + Backend)

#### 1.1 Database Migration
**File**: `supabase/migrations/migration_TIMESTAMP.sql`

Add `is_bookmarked` boolean field to `user_job_status` table:
```sql
-- Add bookmark flag independent of status
ALTER TABLE user_job_status ADD COLUMN is_bookmarked boolean DEFAULT false;

-- Create index for efficient bookmark queries
CREATE INDEX idx_user_job_status_bookmarked ON user_job_status(user_id, is_bookmarked) WHERE is_bookmarked = true;

-- Migrate existing bookmarked status to new field
UPDATE user_job_status 
SET is_bookmarked = true, status = 'pending' 
WHERE status = 'bookmarked';

-- Add comment
COMMENT ON COLUMN user_job_status.is_bookmarked IS 'Independent bookmark flag, separate from delivery status';
```

#### 1.2 Update TypeScript Types
**File**: `src/types/job.ts`

- Remove `'bookmarked'` from `JobStatus` enum
- Add `is_bookmarked: boolean` to `UserJobStatus` interface
- Add `is_bookmarked?: boolean` to `JobWithStatus` interface

#### 1.3 Update Hooks
**File**: `src/hooks/use-jobs.ts`

1. **Update `useJobs`**: 
   - Add `is_bookmarked` to SELECT query
   - Map `is_bookmarked` field in data transformation
   - Remove 'bookmarked' from status filtering logic

2. **Update `useAppliedJobs`**:
   - Remove `.neq('status', 'bookmarked')` filter
   - Keep filtering out 'pending' status only

3. **Add new hook `useBookmarkedJobs`**:
   ```typescript
   export function useBookmarkedJobs() {
     return useQuery({
       queryKey: ['bookmarked-jobs'],
       queryFn: async () => {
         const { data, error } = await supabase
           .from('user_job_status')
           .select('*, job:jobs(*)')
           .eq('is_bookmarked', true)
           .is('job.deleted_at', null)
           .order('updated_at', { ascending: false });
         if (error) throw error;
         return data;
       },
     });
   }
   ```

4. **Update `useUpdateJobStatus`**:
   - Add separate `is_bookmarked` update logic
   - Keep status updates independent

5. **Add new hooks**:
   ```typescript
   export function useToggleBookmark() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: async ({ jobId, isBookmarked }: { jobId: string; isBookmarked: boolean }) => {
         const { error } = await supabase
           .from('user_job_status')
           .upsert({
             job_id: jobId,
             user_id: 'default_user',
             is_bookmarked: isBookmarked,
             updated_at: new Date().toISOString(),
           }, { onConflict: 'job_id,user_id' })
         if (error) throw error;
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['jobs'] });
         queryClient.invalidateQueries({ queryKey: ['bookmarked-jobs'] });
       },
     });
   }
   ```

### Phase 2: Update Frontend Components

#### 2.1 Update Home Page
**File**: `src/pages/home/index.tsx`

1. Replace `useAppliedJobs` bookmark count with `useBookmarkedJobs`
2. Update display logic - remove 'bookmarked' from status filtering:
   ```typescript
   : allJobs  // Show ALL jobs regardless of bookmark status
   ```
3. When `showBookmarked` is true, use `bookmarkedJobs` data

#### 2.2 Update JobCard Component
**File**: `src/components/job/JobCard.tsx`

1. Change bookmark logic to use `is_bookmarked` field instead of status
2. Update `handleBookmark` to use new `useToggleBookmark` hook
3. **Add delete button**:
   ```typescript
   import { Trash2 } from 'lucide-react';
   
   // Add delete handler
   const handleDelete = async (e: React.MouseEvent) => {
     e.stopPropagation();
     if (confirm('确定要删除这个岗位吗？')) {
       await deleteJobMutation.mutateAsync(job.id);
       toast.success('岗位已删除');
     }
   };
   
   // Add delete button in CardFooter
   <Button
     variant="ghost"
     size="icon"
     onClick={handleDelete}
     className="text-destructive"
   >
     <Trash2 className="h-4 w-4" />
   </Button>
   ```

#### 2.3 Update Job Detail Page
**File**: `src/pages/job/[jobId].tsx`

1. Update bookmark toggle logic to use `is_bookmarked` field
2. Change status dropdown to exclude 'bookmarked' option
3. Update `handleToggleBookmark` to use new hook

### Phase 3: Add Web Search Functionality

#### 3.1 Create Web Search Edge Function
**File**: `supabase/functions/search-company-jobs/index.ts`

New Edge Function that uses web search to find job postings:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { company, jobType = "实习" } = await req.json();
  
  // Step 1: Use web search to find company career page
  const searchQuery = `${company} ${jobType} 招聘`;
  const webSearchResponse = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}`, {
    headers: { 'X-Subscription-Token': Deno.env.get('BRAVE_SEARCH_API_KEY') }
  });
  
  // Step 2: Extract relevant job posting URLs
  const searchResults = await webSearchResponse.json();
  const jobUrls = searchResults.web.results
    .filter(r => r.url.includes('recruit') || r.url.includes('jobs') || r.url.includes('career'))
    .slice(0, 5)
    .map(r => r.url);
  
  // Step 3: For each URL, use existing import logic
  const jobs = [];
  for (const url of jobUrls) {
    const jobData = await fetchAndParseJob(url);
    if (jobData) jobs.push(jobData);
  }
  
  return new Response(JSON.stringify({ success: true, jobs }));
});
```

#### 3.2 Update Import Page UI
**File**: `src/pages/import/index.tsx`

Add third tab "智能搜索":
- Input: Company name + job type
- Button: "搜索岗位"
- Results: Show found jobs with preview and "添加" buttons

**OR** integrate into existing "链接导入" tab:
- Detect if input is company name vs URL
- Show "搜索 [公司名] 的岗位" button option

### Phase 4: Update Related Components

#### 4.1 Update StatusFilter
**File**: `src/components/sidebar/StatusFilter.tsx`

Remove 'bookmarked' from status list if present

#### 4.2 Update CollapsibleSidebar  
**File**: `src/components/sidebar/CollapsibleSidebar.tsx`

Update bookmark count calculation to use new data source

## Critical Files to Modify

### Database
- `supabase/migrations/migration_TIMESTAMP.sql` (new migration)

### Backend/Hooks
- `src/hooks/use-jobs.ts` (major refactor)

### Frontend Components
- `src/components/job/JobCard.tsx` (add delete button, fix bookmark)
- `src/pages/home/index.tsx` (fix bookmark display logic)
- `src/pages/job/[jobId].tsx` (fix bookmark logic)
- `src/pages/import/index.tsx` (add web search tab - optional)

### Types
- `src/types/job.ts` (update types)

### New Files
- `supabase/functions/search-company-jobs/index.ts` (optional web search)

## Testing & Verification

### Test Bookmark System
1. Bookmark a job from home page → Job should stay visible
2. Check bookmark count → Should show correct number
3. Click "收藏" in sidebar → Should show only bookmarked jobs
4. Change job status to "已投递" → Should keep bookmark status
5. Toggle bookmark on/off → Should work without affecting delivery status

### Test Delete Functionality
1. Hover over job card → Should see delete button
2. Click delete → Should prompt confirmation
3. Confirm delete → Job should disappear and move to "已删除"
4. Navigate to "已删除" → Should see deleted job
5. Click restore → Job should reappear in main list

### Test Web Search (if implemented)
1. Enter company name "字节跳动"
2. Click search → Should find job postings
3. Review results → Should show relevant internship positions
4. Click add → Should import job to database

## Migration Strategy

**Phase 1 (Critical)**: Deploy bookmark fix first
- User pain point: Jobs disappearing
- High impact, medium complexity
- Requires database migration

**Phase 2 (High Priority)**: Add delete buttons to cards
- User request: Convenience improvement  
- Low complexity, quick win

**Phase 3 (Enhancement)**: Web search feature
- User suggestion: Nice-to-have
- High complexity, requires API key
- Can be added later

## Notes

- Bookmark field added to `user_job_status` maintains data integrity
- Existing bookmarked jobs will be migrated automatically
- Delete button uses icon-only design to save space in card
- Web search may require Brave Search API key or alternative search API
- Consider rate limiting for web search to avoid quota exhaustion
