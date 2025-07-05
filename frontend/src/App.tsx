import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import BackgroundEffects from "./components/BackgroundEffects";
import Home from "./pages/Home";
import Registry from "./pages/Registry";
import Logs from "./pages/Logs";
import Docs from "./pages/Docs";
import HowItWorks from "./pages/HowItWorks";
import Vulnerabilities from "./pages/Vulnerabilities";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-950 relative">
          <BackgroundEffects />
          <Navigation />
          <main className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/registry" element={<Registry />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/vulns" element={<Vulnerabilities />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
