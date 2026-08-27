import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
const Home = lazy(() => import("@/pages/home"));
const HomeV2 = lazy(() => import("@/pages/home-v2"));
const HomeV3 = lazy(() => import("@/pages/home-v3"));
import HomeFinal from "@/pages/home-final";
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminList = lazy(() => import("@/pages/admin/list"));
const AdminEditor = lazy(() => import("@/pages/admin/editor"));
import ContentIndexPage from "@/pages/content/index-page";
import ContentDetailPage from "@/pages/content/detail-page";
import ReportsPage from "@/pages/reports";
const AdminReportsList = lazy(() => import("@/pages/admin/reports-list"));
const AdminReportsEditor = lazy(() => import("@/pages/admin/reports-editor"));
import ContactPage from "@/pages/contact";
const AdminSubmissions = lazy(() => import("@/pages/admin/submissions"));
const AdminHomepage = lazy(() => import("@/pages/admin/homepage"));

const queryClient = new QueryClient();

function PageFallback() {
  return <div className="min-h-screen bg-white" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeFinal} />
      <Route path="/v3" component={HomeV3} />
      <Route path="/v2" component={HomeV2} />
      <Route path="/legacy" component={Home} />
      <Route path="/blog/:slug" component={() => <ContentDetailPage type="blog" />} />
      <Route path="/blog" component={() => <ContentIndexPage type="blog" />} />
      <Route path="/articles/:slug" component={() => <ContentDetailPage type="articles" />} />
      <Route path="/articles" component={() => <ContentIndexPage type="articles" />} />
      <Route path="/case-studies/:slug" component={() => <ContentDetailPage type="case_studies" />} />
      <Route path="/case-studies" component={() => <ContentIndexPage type="case_studies" />} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/homepage" component={AdminHomepage} />
      <Route path="/admin/blog/new" component={() => <AdminEditor type="blog" />} />
      <Route path="/admin/blog/:id" component={() => <AdminEditor type="blog" />} />
      <Route path="/admin/blog" component={() => <AdminList type="blog" />} />
      <Route path="/admin/articles/new" component={() => <AdminEditor type="articles" />} />
      <Route path="/admin/articles/:id" component={() => <AdminEditor type="articles" />} />
      <Route path="/admin/articles" component={() => <AdminList type="articles" />} />
      <Route path="/admin/case-studies/new" component={() => <AdminEditor type="case_studies" />} />
      <Route path="/admin/case-studies/:id" component={() => <AdminEditor type="case_studies" />} />
      <Route path="/admin/case-studies" component={() => <AdminList type="case_studies" />} />
      <Route path="/admin/reports/new" component={AdminReportsEditor} />
      <Route path="/admin/reports/:id" component={AdminReportsEditor} />
      <Route path="/admin/reports" component={AdminReportsList} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/admin/submissions" component={AdminSubmissions} />
      <Route path="/admin" component={() => <AdminList type="blog" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Suspense fallback={<PageFallback />}>
            <Router />
          </Suspense>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
