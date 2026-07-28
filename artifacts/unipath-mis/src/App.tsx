import { ErrorBoundary } from '@/components/ErrorBoundary';
import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from 'next-themes';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Projects = lazy(() => import('@/pages/Projects'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const ProjectForm = lazy(() => import('@/pages/ProjectForm'));
const InvoiceForm = lazy(() => import('@/pages/InvoiceForm'));
const Clients = lazy(() => import('@/pages/Clients'));
const Services = lazy(() => import('@/pages/Services'));
const Scientists = lazy(() => import('@/pages/Scientists'));
const Territories = lazy(() => import('@/pages/Territories'));
const Invoices = lazy(() => import('@/pages/Invoices'));
const Payments = lazy(() => import('@/pages/Payments'));
const Analytics = lazy(() => import('@/pages/Analytics'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <ErrorBoundary><Suspense fallback={<LoadingFallback />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/projects" component={Projects} />
          <Route path="/projects/new" component={ProjectForm} />
          <Route path="/projects/:id/edit" component={ProjectForm} />
          <Route path="/projects/:id" component={ProjectDetail} />
          <Route path="/clients" component={Clients} />
          <Route path="/services" component={Services} />
          <Route path="/scientists" component={Scientists} />
          <Route path="/territories" component={Territories} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/invoices/new" component={InvoiceForm} />
          <Route path="/invoices/:id/edit" component={InvoiceForm} />
          <Route path="/payments" component={Payments} />
          <Route path="/analytics" component={Analytics} />
          <Route component={NotFound} />
        </Switch>
      </Suspense></ErrorBoundary>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
