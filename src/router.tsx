import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Interview from "./pages/interview/[jobId]";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <Index />,
    },
    {
      path: "/interview/:jobId",
      name: 'interview',
      element: <Interview />,
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