import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UpdateBanner } from "@/components/UpdateBanner";
import { GlobalAnnouncementModal } from "@/components/GlobalAnnouncementModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { usePixNotificationChecker } from "./hooks/usePixNotificationChecker";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useTimezoneSync } from "./hooks/useTimezoneSync";
import { LoadingScreen } from "./components/LoadingScreen";

// Páginas essenciais - carregam sempre (bundle inicial)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import SelectRole from "./pages/SelectRole";
import Subscribe from "./pages/Subscribe";
import AppHub from "./pages/AppHub";
import NotFound from "./pages/NotFound";

// Páginas públicas - lazy loading
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));

// Páginas de artista - lazy loading
const ArtistDashboard = lazy(() => import("./pages/artist/Dashboard"));
const ArtistShows = lazy(() => import("./pages/artist/Shows"));
const ArtistMusicians = lazy(() => import("./pages/artist/Musicians"));
const ArtistVenues = lazy(() => import("./pages/artist/Venues"));
const ArtistCalendar = lazy(() => import("./pages/artist/Calendar"));
const ArtistReports = lazy(() => import("./pages/artist/Reports"));
const ArtistTransportation = lazy(() => import("./pages/artist/Transportation"));
const ArtistExpenses = lazy(() => import("./pages/artist/Expenses"));
const ArtistInvoiceSimulator = lazy(() => import("./pages/artist/InvoiceSimulator"));
const ArtistSupport = lazy(() => import("./pages/artist/Support"));
const ArtistProfile = lazy(() => import("./pages/artist/Profile"));
const ArtistSettings = lazy(() => import("./pages/artist/Settings"));
const ArtistSubscription = lazy(() => import("./pages/artist/Subscription"));
const ArtistTerms = lazy(() => import("./pages/artist/Terms"));
const ArtistPrivacy = lazy(() => import("./pages/artist/Privacy"));
const ArtistUpdates = lazy(() => import("./pages/artist/Updates"));
const ArtistTutorial = lazy(() => import("./pages/artist/Tutorial"));

// Páginas de músico - lazy loading
const MusicianDashboard = lazy(() => import("./pages/musician/Dashboard"));
const MusicianShows = lazy(() => import("./pages/musician/Shows"));
const MusicianArtists = lazy(() => import("./pages/musician/Artists"));
const MusicianCalendar = lazy(() => import("./pages/musician/Calendar"));
const MusicianReports = lazy(() => import("./pages/musician/Reports"));
const MusicianTransportation = lazy(() => import("./pages/musician/Transportation"));
const MusicianExpenses = lazy(() => import("./pages/musician/Expenses"));
const MusicianSupport = lazy(() => import("./pages/musician/Support"));
const MusicianProfile = lazy(() => import("./pages/musician/Profile"));
const MusicianSettings = lazy(() => import("./pages/musician/Settings"));
const MusicianSubscription = lazy(() => import("./pages/musician/Subscription"));
const MusicianTerms = lazy(() => import("./pages/musician/Terms"));
const MusicianPrivacy = lazy(() => import("./pages/musician/Privacy"));
const MusicianUpdates = lazy(() => import("./pages/musician/Updates"));
const MusicianTutorial = lazy(() => import("./pages/musician/Tutorial"));

// Páginas admin/suporte - lazy loading
const Admin = lazy(() => import("./pages/Admin"));
const Support = lazy(() => import("./pages/Support"));

// Páginas demo - lazy loading
const DemoSelectRole = lazy(() => import("./pages/DemoSelectRole"));
const DemoArtistDashboard = lazy(() => import("./pages/demo/artist/Dashboard"));
const DemoArtistShows = lazy(() => import("./pages/demo/artist/Shows"));
const DemoArtistCalendar = lazy(() => import("./pages/demo/artist/Calendar"));
const DemoArtistReports = lazy(() => import("./pages/demo/artist/Reports"));
const DemoArtistTransportation = lazy(() => import("./pages/demo/artist/Transportation"));
const DemoArtistSupport = lazy(() => import("./pages/demo/artist/Support"));
const DemoArtistProfile = lazy(() => import("./pages/demo/artist/Profile"));
const DemoArtistSettings = lazy(() => import("./pages/demo/artist/Settings"));
const DemoArtistExpenses = lazy(() => import("./pages/demo/artist/Expenses"));
const DemoArtistInvoiceSimulator = lazy(() => import("./pages/demo/artist/InvoiceSimulator"));
const DemoMusicianDashboard = lazy(() => import("./pages/demo/musician/Dashboard"));
const DemoMusicianShows = lazy(() => import("./pages/demo/musician/Shows"));
const DemoMusicianArtists = lazy(() => import("./pages/demo/musician/Artists"));
const DemoMusicianCalendar = lazy(() => import("./pages/demo/musician/Calendar"));
const DemoMusicianReports = lazy(() => import("./pages/demo/musician/Reports"));
const DemoMusicianTransportation = lazy(() => import("./pages/demo/musician/Transportation"));
const DemoMusicianSupport = lazy(() => import("./pages/demo/musician/Support"));
const DemoMusicianProfile = lazy(() => import("./pages/demo/musician/Profile"));
const DemoMusicianSettings = lazy(() => import("./pages/demo/musician/Settings"));
const DemoMusicianExpenses = lazy(() => import("./pages/demo/musician/Expenses"));

const queryClient = new QueryClient();

const AppRoutes = () => {
  usePixNotificationChecker();
  usePushNotifications();
  useTimezoneSync();
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/r/:code" element={<ReferralRedirect />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/app" element={<AppHub />} />
        
        {/* Protected Artist Routes */}
        <Route path="/artist/dashboard" element={<ProtectedRoute requiredRole="artist"><ArtistDashboard /></ProtectedRoute>} />
        <Route path="/artist/shows" element={<ProtectedRoute requiredRole="artist"><ArtistShows /></ProtectedRoute>} />
        <Route path="/artist/musicians" element={<ProtectedRoute requiredRole="artist"><ArtistMusicians /></ProtectedRoute>} />
        <Route path="/artist/venues" element={<ProtectedRoute requiredRole="artist"><ArtistVenues /></ProtectedRoute>} />
        <Route path="/artist/calendar" element={<ProtectedRoute requiredRole="artist"><ArtistCalendar /></ProtectedRoute>} />
        <Route path="/artist/reports" element={<ProtectedRoute requiredRole="artist"><ArtistReports /></ProtectedRoute>} />
        <Route path="/artist/transportation" element={<ProtectedRoute requiredRole="artist"><ArtistTransportation /></ProtectedRoute>} />
        <Route path="/artist/expenses" element={<ProtectedRoute requiredRole="artist"><ArtistExpenses /></ProtectedRoute>} />
        <Route path="/artist/invoice-simulator" element={<ProtectedRoute requiredRole="artist"><ArtistInvoiceSimulator /></ProtectedRoute>} />
        <Route path="/artist/support" element={<ProtectedRoute requiredRole="artist"><ArtistSupport /></ProtectedRoute>} />
        <Route path="/artist/profile" element={<ProtectedRoute requiredRole="artist"><ArtistProfile /></ProtectedRoute>} />
        <Route path="/artist/settings" element={<ProtectedRoute requiredRole="artist"><ArtistSettings /></ProtectedRoute>} />
        <Route path="/artist/subscription" element={<ProtectedRoute requiredRole="artist"><ArtistSubscription /></ProtectedRoute>} />
        <Route path="/artist/terms" element={<ProtectedRoute requiredRole="artist"><ArtistTerms /></ProtectedRoute>} />
        <Route path="/artist/privacy" element={<ProtectedRoute requiredRole="artist"><ArtistPrivacy /></ProtectedRoute>} />
        <Route path="/artist/updates" element={<ProtectedRoute requiredRole="artist"><ArtistUpdates /></ProtectedRoute>} />
        <Route path="/artist/tutorial" element={<ProtectedRoute requiredRole="artist"><ArtistTutorial /></ProtectedRoute>} />
        
        {/* Protected Musician Routes */}
        <Route path="/musician/dashboard" element={<ProtectedRoute requiredRole="musician"><MusicianDashboard /></ProtectedRoute>} />
        <Route path="/musician/shows" element={<ProtectedRoute requiredRole="musician"><MusicianShows /></ProtectedRoute>} />
        <Route path="/musician/artists" element={<ProtectedRoute requiredRole="musician"><MusicianArtists /></ProtectedRoute>} />
        <Route path="/musician/calendar" element={<ProtectedRoute requiredRole="musician"><MusicianCalendar /></ProtectedRoute>} />
        <Route path="/musician/reports" element={<ProtectedRoute requiredRole="musician"><MusicianReports /></ProtectedRoute>} />
        <Route path="/musician/transportation" element={<ProtectedRoute requiredRole="musician"><MusicianTransportation /></ProtectedRoute>} />
        <Route path="/musician/expenses" element={<ProtectedRoute requiredRole="musician"><MusicianExpenses /></ProtectedRoute>} />
        <Route path="/musician/support" element={<ProtectedRoute requiredRole="musician"><MusicianSupport /></ProtectedRoute>} />
        <Route path="/musician/profile" element={<ProtectedRoute requiredRole="musician"><MusicianProfile /></ProtectedRoute>} />
        <Route path="/musician/settings" element={<ProtectedRoute requiredRole="musician"><MusicianSettings /></ProtectedRoute>} />
        <Route path="/musician/subscription" element={<ProtectedRoute requiredRole="musician"><MusicianSubscription /></ProtectedRoute>} />
        <Route path="/musician/terms" element={<ProtectedRoute requiredRole="musician"><MusicianTerms /></ProtectedRoute>} />
        <Route path="/musician/privacy" element={<ProtectedRoute requiredRole="musician"><MusicianPrivacy /></ProtectedRoute>} />
        <Route path="/musician/updates" element={<ProtectedRoute requiredRole="musician"><MusicianUpdates /></ProtectedRoute>} />
        <Route path="/musician/tutorial" element={<ProtectedRoute requiredRole="musician"><MusicianTutorial /></ProtectedRoute>} />
        
        {/* Protected Admin/Support Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
        <Route path="/support-tickets" element={<ProtectedRoute allowedRoles={['admin', 'support']}><Support /></ProtectedRoute>} />
        
        {/* Demo Routes (public) */}
        <Route path="/demo" element={<DemoSelectRole />} />
        <Route path="/demo/artist/dashboard" element={<DemoArtistDashboard />} />
        <Route path="/demo/artist/shows" element={<DemoArtistShows />} />
        <Route path="/demo/artist/calendar" element={<DemoArtistCalendar />} />
        <Route path="/demo/artist/reports" element={<DemoArtistReports />} />
        <Route path="/demo/artist/transportation" element={<DemoArtistTransportation />} />
        <Route path="/demo/artist/support" element={<DemoArtistSupport />} />
        <Route path="/demo/artist/profile" element={<DemoArtistProfile />} />
        <Route path="/demo/artist/settings" element={<DemoArtistSettings />} />
        <Route path="/demo/artist/expenses" element={<DemoArtistExpenses />} />
        <Route path="/demo/artist/invoice-simulator" element={<DemoArtistInvoiceSimulator />} />
        <Route path="/demo/musician/dashboard" element={<DemoMusicianDashboard />} />
        <Route path="/demo/musician/shows" element={<DemoMusicianShows />} />
        <Route path="/demo/musician/artists" element={<DemoMusicianArtists />} />
        <Route path="/demo/musician/calendar" element={<DemoMusicianCalendar />} />
        <Route path="/demo/musician/reports" element={<DemoMusicianReports />} />
        <Route path="/demo/musician/transportation" element={<DemoMusicianTransportation />} />
        <Route path="/demo/musician/support" element={<DemoMusicianSupport />} />
        <Route path="/demo/musician/profile" element={<DemoMusicianProfile />} />
        <Route path="/demo/musician/settings" element={<DemoMusicianSettings />} />
        <Route path="/demo/musician/expenses" element={<DemoMusicianExpenses />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <UpdateBanner />
      <div className="safe-area-status-bar fixed top-0 left-0 right-0 z-[9999]" />
      <div className="safe-area-top">
        <BrowserRouter>
          <AuthProvider>
            <GlobalAnnouncementModal />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
