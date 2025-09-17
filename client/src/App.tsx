import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { BalanceProvider } from "./contexts/BalanceContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "@/pages/not-found";

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-primary-foreground font-bold text-2xl">C</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <BalanceProvider>{children}</BalanceProvider>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthWrapper>
            <Toaster />
            <Router />
          </AuthWrapper>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
