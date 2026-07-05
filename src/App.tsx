import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { JarvisAssistant } from "@/components/JarvisAssistant";
import { FocusGuardOverlay } from "@/components/FocusGuardOverlay";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DemoBanner } from "@/components/DemoBanner";

import Index from "./pages/Index";
import Notes from "./pages/Notes";
import Assignments from "./pages/Assignments";
import CalendarPage from "./pages/Calendar";
import Timetable from "./pages/Timetable";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Flashcards from "./pages/Flashcards";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PreferencesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AssistantProvider>
              <DemoBanner />

              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
                <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <JarvisAssistant />
              <FocusGuardOverlay />
            </AssistantProvider>
          </BrowserRouter>
        </TooltipProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
