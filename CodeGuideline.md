# Code Guideline

## Project Structure Overview

```
project-root/
  ├── public/                # Static assets (favicon, robots.txt, etc.)
  ├── src/
  │   ├── components/        # All reusable UI components
  │   │   ├── ui/            # Prebuilt and custom UI components, grouped by function
  │   │   ├── layout/        # Layout components (MainLayout)
  │   │   ├── category/      # Category sidebar components
  │   │   ├── applied/       # Applied jobs sidebar components
  │   │   ├── job/           # Job listing components (JobCard, JobList)
  │   │   └── interview/     # AI interview components (InterviewMessage)
  │   ├── hooks/             # Custom React hooks
  │   │   ├── use-job-categories.ts  # Fetch job categories
  │   │   ├── use-jobs.ts            # Fetch and manage jobs
  │   │   ├── use-ai-interview.ts    # AI interview logic
  │   │   └── use-mobile.tsx         # Mobile detection
  │   ├── lib/               # Utility functions and libraries
  │   │   ├── date-utils.ts          # Date formatting utilities
  │   │   ├── status-colors.ts       # Job status color mapping
  │   │   └── utils.ts               # General utilities
  │   ├── pages/             # Application pages (each page in its own subdirectory)
  │   │   ├── home/          # Main job board page
  │   │   └── interview/     # AI interview page
  │   ├── types/             # TypeScript type definitions
  │   │   ├── job.ts         # Job-related types
  │   │   └── interview.ts   # Interview-related types
  │   ├── integrations/      # Third-party integrations
  │   │   └── supabase/      # Supabase client and types
  │   ├── App.tsx            # Main app component, sets up route providers
  │   ├── router.tsx         # Router config, sets up routing
  │   ├── main.tsx           # Entry point for the React app
  │   └── index.css          # Global styles and design tokens
  ├── supabase/              # Backend configuration
  │   ├── functions/         # Edge Functions
  │   │   └── ai-interview-62325baf28c7/  # AI interview Edge Function
  │   └── migrations/        # Database migrations
  ├── package.json           # Project metadata and scripts
  ├── tailwind.config.ts     # Tailwind CSS configuration
  └── ...                    # Other config and lock files
```

## Directory Responsibilities

- **public/**: Static files served directly. Place images, icons, and robots.txt here.
- **src/components/**: All UI components.  
  - **ui/**: Contains atomic and composite UI components (shadcn/ui).
  - **layout/**: Layout wrapper components like MainLayout.
  - **category/**: Job category sidebar and related components.
  - **applied/**: Applied jobs sidebar and job item components.
  - **job/**: Job listing, card, and filter components.
  - **interview/**: AI interview chat message components.
- **src/hooks/**: Custom React hooks. Each file should export a single hook focused on one responsibility.
- **src/lib/**: Utility functions and libraries that are not React components or hooks.
- **src/types/**: TypeScript type definitions shared across the app.
- **src/pages/**: All route-level pages.  
  - *Each page should have its own subdirectory if it contains more than a single file or has related logic/components.*
- **src/integrations/**: Third-party service integrations (Supabase, etc.).
- **supabase/**: Backend configuration including Edge Functions and database migrations.
- **src/App.tsx**: Sets up global providers.
- **src/router.tsx**: Sets up routing.
- **src/main.tsx**: Application entry point.

**Important:**
Whenever a new module (such as a component, hook, or utility) or a new page is added or removed, this document **must be updated immediately** to reflect the changes. Keeping this documentation up to date ensures that all collaborators have a clear understanding of the current project structure and its intended organization.

## Application Features

### Core Functionality
1. **Job Board**: Browse and search internship opportunities with filtering by category
2. **Application Tracking**: Mark jobs as bookmarked or applied, track interview progress
3. **Status Management**: Update job application status (applied → written test → interview rounds → offer)
4. **AI Mock Interview**: Practice interviews with AI based on specific job descriptions

### Key Components
- **MainLayout**: Three-column layout (category sidebar, main content, applied jobs sidebar)
- **JobCard**: Displays job information with action buttons (bookmark, apply, AI interview)
- **AppliedJobItem**: Shows applied jobs with status update dropdown
- **InterviewMessage**: AI chat message component with thinking process display

### Data Flow
- Jobs are fetched from Supabase and filtered based on category and status
- User actions (bookmark, apply, status update) mutate data via React Query
- AI interviews use streaming SSE via Supabase Edge Functions
- All state management handled by React Query with optimistic updates

## How to Add New Code

### 1. Adding a New Page

- **Create a subdirectory under `src/pages/` for each new page.**
  - Example: For a "Dashboard" page, create `src/pages/dashboard/`.
- **Place the main page component as `index.tsx` inside the subdirectory.**
- **Add any page-specific components or logic in the same subdirectory.**
- **Register the new route in `src/router.tsx and generate a semantic name.**
  - Example:
    ```tsx
    import Dashboard from "./pages/dashboard";
    // ...
    {
      path: "/dashboard",
      name: 'dashboard',
      element: <Dashboard />
    }
    ```

### 2. Adding a New Component

- **If you are adding a group of related components, create a subdirectory (e.g., `form/`, `charts/`).**
- **If the component is only used by a specific page, place it in that page's subdirectory under `src/pages/`.**
- **Each component should be focused on a single responsibility.**
- **Small files (< 100 lines) are encouraged for a single component.**

### 3. Adding a New Hook

- **Create a new file in `src/hooks/` named after the hook (e.g., `use-feature.ts`).**
- **Each file should export only one hook.**
- **Hooks should be as small and focused as possible.**

### 4. Adding Utilities

- **Add utility functions to `src/lib/`.**
- **Group related utilities in the same file or subdirectory if needed.**

### 5. Adding Edge Functions

- **Create Edge Functions in `supabase/functions/[function-name]/`.**
- **Use unique names with project suffix (e.g., `ai-interview-62325baf28c7`).**
- **Always handle CORS and error cases properly.**

## Coding Best Practices

- **One module, one responsibility:**  
  Each file (component, hook, utility) should do one thing only.
- **High cohesion, low coupling:**  
  Keep related logic together and avoid unnecessary dependencies between modules.
- **Naming conventions:**  
  - Use `PascalCase` for components and page directories.
  - Use `camelCase` for hooks and utility functions.
  - Name page subdirectories and files after their route or feature.
- **Component structure:**  
  - Keep components small and focused.
  - Extract subcomponents if a component grows too large.
- **Page structure:**  
  - Place all logic, hooks, and components specific to a page in its subdirectory.
  - Only share code via `components/`, `hooks/`, or `lib/` if it is truly reusable.
- **Documentation:**  
  - Add comments for complex logic.
  - Document the purpose of each module at the top of the file if not obvious.

## Backend & Database

### Supabase Tables
- **job_categories**: Job category definitions
- **jobs**: Job listings with company, description, and metadata
- **user_job_status**: User's application status for each job
- **mock_interview_sessions**: AI interview conversation history

### Edge Functions
- **ai-interview-62325baf28c7**: Handles AI mock interview conversations using Claude Sonnet 4.5

### Key Patterns
- Always use Supabase client methods, never raw SQL in frontend
- Enable RLS policies for all tables
- Use React Query for data fetching and caching
- Implement optimistic updates for better UX

## Example: Adding a New "Profile" Page

1. **Create a directory:**  
   `src/pages/profile/`
2. **Add the main page component:**  
   `src/pages/profile/index.tsx`
3. **Add page-specific components:**  
   `src/pages/profile/ProfileHeader.tsx`, `src/pages/profile/ProfileDetails.tsx`
4. **Register the route in `src/router.tsx`:**
   ```tsx
   import Profile from "./pages/profile";
   // ...
   {
     path: "/profile",
     name: 'profile',
     element: <Profile />
   }
   ```
5. **If you need a reusable button, add it to `src/components/ui/button.tsx`.**
