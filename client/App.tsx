import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Placeholder component for future pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This page is coming soon. Continue prompting to help us build out this section!
        </p>
        <div className="max-w-md mx-auto p-6 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Aura Oasis is being built with your help. Tell us what you'd like to see on this page,
            and we'll create it for you.
          </p>
        </div>
      </div>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Index />
            </Layout>
          } />
          <Route path="/services" element={<PlaceholderPage title="Wellness Services" />} />
          <Route path="/about" element={<PlaceholderPage title="About Aura Oasis" />} />
          <Route path="/meditation" element={<PlaceholderPage title="Meditation Center" />} />
          <Route path="/contact" element={<PlaceholderPage title="Contact Us" />} />
          <Route path="/faq" element={<PlaceholderPage title="Frequently Asked Questions" />} />
          <Route path="/support" element={<PlaceholderPage title="Support Center" />} />
          <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" />} />
          <Route path="/terms" element={<PlaceholderPage title="Terms of Service" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={
            <Layout>
              <NotFound />
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
