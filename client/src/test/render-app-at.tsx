import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import { Router as WouterRouter } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallProvider } from "@/hooks/use-pwa-install";
import { AppRouter } from "@/App";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/** Renders the same provider stack as `App`, with an in-memory route for deterministic routing tests. */
export function renderAppAt(initialPath: string): RenderResult {
  const { hook } = memoryLocation({ path: initialPath });
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="plegit-theme-test">
        <PWAInstallProvider>
          <TooltipProvider>
            <Toaster />
            <WouterRouter hook={hook}>
              <AppRouter />
            </WouterRouter>
          </TooltipProvider>
        </PWAInstallProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
