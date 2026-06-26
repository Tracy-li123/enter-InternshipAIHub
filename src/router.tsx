import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Interview from "./pages/interview/[jobId]";
import Dashboard from "./pages/dashboard";
import JobDetail from "./pages/job/[jobId]";
import ImportPage from "./pages/import/index";
import AuthPage from "./pages/auth/index";
import { AuthGuard } from "./components/auth/AuthGuard";

export const routers = [
    {
      path: "/auth",
      name: 'auth',
      element: <AuthPage />,
    },
    {
      path: "/",
      name: 'home',
      element: <AuthGuard><Index /></AuthGuard>,
    },
    {
      path: "/job/:jobId",
      name: 'jobDetail',
      element: <AuthGuard><JobDetail /></AuthGuard>,
    },
    {
      path: "/interview/:jobId",
      name: 'interview',
      element: <AuthGuard><Interview /></AuthGuard>,
    },
    {
      path: "/dashboard",
      name: 'dashboard',
      element: <AuthGuard><Dashboard /></AuthGuard>,
    },
    {
      path: "/import",
      name: 'import',
      element: <AuthGuard><ImportPage /></AuthGuard>,
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
