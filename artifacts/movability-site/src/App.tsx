import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import HomeV2 from "@/pages/home-v2";
import HomeV3 from "@/pages/home-v3";
import HomeFinal from "@/pages/home-final";
import AdminLogin from "@/pages/admin/login";
import AdminList from "@/pages/admin/list";
import AdminEditor from "@/pages/admin/editor";
import ContentIndexPage from "@/pages/content/index-page";
import ContentDetailPage from "@/pages/content/detail-page";
import ReportsPage from "@/pages/reports";
import AdminReportsList from "@/pages/admin/reports-list";
import AdminReportsEditor from "@/pages/admin/reports-editor";
import ContactPage from "@/pages/contact";
import AdminSubmissions from "@/pages/admin/submissions";
import AdminHomepage from "@/pages/admin/homepage";

const queryClient = new QueryClient();

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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}> <Router /> </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
