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
const Showcase = lazy(() => import("./pages/Showcase.tsx"));
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
const Members = lazy(() => import("./pages/Members.tsx"));
const MemberProfile = lazy(() => import("./pages/MemberProfile.tsx"));
const AccessibilityStatement = lazy(() => import("./pages/AccessibilityStatement.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const TermsOfService = lazy(() => import("./pages/TermsOfService.tsx"));
const AdminShowcase = lazy(() => import("./pages/AdminShowcase.tsx"));
const ShowcaseDetail = lazy(() => import("./pages/ShowcaseDetail.tsx"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications.tsx"));
const AuditLog = lazy(() => import("./pages/AuditLog.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const ApplyVibetor = lazy(() => import("./pages/ApplyVibetor.tsx"));
const ApplyViber = lazy(() => import("./pages/ApplyViber.tsx"));
const ApplyStarter = lazy(() => import("./pages/ApplyStarter.tsx"));
const Badges = lazy(() => import("./pages/Badges.tsx"));
const AdminBadges = lazy(() => import("./pages/AdminBadges.tsx"));
const AdminCertificates = lazy(() => import("./pages/AdminCertificates.tsx"));
const CertificateVerify = lazy(() => import("./pages/CertificateVerify.tsx"));
const AdminEmailHealth = lazy(() => import("./pages/AdminEmailHealth.tsx"));
const AdminEventRegistrations = lazy(() => import("./pages/AdminEventRegistrations.tsx"));
const AdminMessages = lazy(() => import("./pages/AdminMessages.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
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
                <Route path="/showcase" element={<Showcase />} />
                <Route path="/showcase/:id" element={<ShowcaseDetail />} />
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
                <Route path="/members" element={<Members />} />
                <Route path="/members/:userId" element={<MemberProfile />} />
                <Route path="/accessibility" element={<AccessibilityStatement />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/admin/showcase" element={<AdminShowcase />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/audit-log" element={<AuditLog />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/apply-vibetor" element={<ApplyVibetor />} />
                <Route path="/apply-viber" element={<ApplyViber />} />
                <Route path="/apply-starter" element={<ApplyStarter />} />
                <Route path="/badges" element={<Badges />} />
                <Route path="/admin/badges" element={<AdminBadges />} />
                <Route path="/admin/certificates" element={<AdminCertificates />} />
                <Route path="/certificates/:id" element={<CertificateVerify />} />
                <Route path="/admin/email-health" element={<AdminEmailHealth />} />
                <Route path="/admin/event-registrations" element={<AdminEventRegistrations />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
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
