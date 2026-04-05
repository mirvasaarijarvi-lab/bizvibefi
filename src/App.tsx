import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/i18n/TranslationContext";
import { translations } from "@/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index.tsx"));
const Community = lazy(() => import("./pages/Community.tsx"));
const GetGoing = lazy(() => import("./pages/GetGoing.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const Forum = lazy(() => import("./pages/Forum.tsx"));
const ForumCategory = lazy(() => import("./pages/ForumCategory.tsx"));
const ForumTopic = lazy(() => import("./pages/ForumTopic.tsx"));
const AccessibilityStatement = lazy(() => import("./pages/AccessibilityStatement.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider translations={translations}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/community" element={<Community />} />
                <Route path="/get-going" element={<GetGoing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/events" element={<Events />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/forum/:slug" element={<ForumCategory />} />
                <Route path="/forum/:slug/:topicId" element={<ForumTopic />} />
                <Route path="/accessibility" element={<AccessibilityStatement />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
