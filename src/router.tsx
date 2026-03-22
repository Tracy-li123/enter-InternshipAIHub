import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Interview from "./pages/interview/[jobId]";
import Dashboard from "./pages/dashboard";
import JobDetail from "./pages/job/[jobId]";
import ImportPage from "./pages/import/index";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <Index />,
    },
    {
      path: "/job/:jobId",
      name: 'jobDetail',
      element: <JobDetail />,
    },
    {
      path: "/interview/:jobId",
      name: 'interview',
      element: <Interview />,
    },
    {
      path: "/dashboard",
      name: 'dashboard',
      element: <Dashboard />,
    },
    {
      path: "/import",
      name: 'import',
      element: <ImportPage />,
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: <NotFound />,
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;