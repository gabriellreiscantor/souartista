import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UpdateBanner } from "@/components/UpdateBanner";
import { GlobalAnnouncementModal } from "@/components/GlobalAnnouncementModal";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { usePixNotificationChecker } from "./hooks/usePixNotificationChecker";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useTimezoneSync } from "./hooks/useTimezoneSync";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CompleteProfile from "./pages/CompleteProfile";
import SelectRole from "./pages/SelectRole";
import Subscribe from "./pages/Subscribe";
import AppHub from "./pages/AppHub";
import ArtistDashboard from "./pages/artist/Dashboard";
import ArtistShows from "./pages/artist/Shows";
import ArtistMusicians from "./pages/artist/Musicians";
import ArtistVenues from "./pages/artist/Venues";
import ArtistCalendar from "./pages/artist/Calendar";
import ArtistReports from "./pages/artist/Reports";
import ArtistTransportation from "./pages/artist/Transportation";
import ArtistExpenses from "./pages/artist/Expenses";
import ArtistInvoiceSimulator from "./pages/artist/InvoiceSimulator";
import MusicianDashboard from "./pages/musician/Dashboard";
import MusicianShows from "./pages/musician/Shows";
import MusicianArtists from "./pages/musician/Artists";
import MusicianCalendar from "./pages/musician/Calendar";
import MusicianReports from "./pages/musician/Reports";
import MusicianTransportation from "./pages/musician/Transportation";
import MusicianExpenses from "./pages/musician/Expenses";
import ArtistSupport from "./pages/artist/Support";
import MusicianSupport from "./pages/musician/Support";
import ArtistProfile from "./pages/artist/Profile";
import MusicianProfile from "./pages/musician/Profile";
import ArtistSettings from "./pages/artist/Settings";
import MusicianSettings from "./pages/musician/Settings";
import ArtistSubscription from "./pages/artist/Subscription";
import MusicianSubscription from "./pages/musician/Subscription";
import ArtistTerms from "./pages/artist/Terms";
import MusicianTerms from "./pages/musician/Terms";
import ArtistPrivacy from "./pages/artist/Privacy";
import MusicianPrivacy from "./pages/musician/Privacy";
import ArtistUpdates from "./pages/artist/Updates";
import MusicianUpdates from "./pages/musician/Updates";
import ArtistTutorial from "./pages/artist/Tutorial";
import MusicianTutorial from "./pages/musician/Tutorial";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import Contador from "./pages/Contador";
import NotFound from "./pages/NotFound";
import ReferralRedirect from "./pages/ReferralRedirect";
import DemoSelectRole from "./pages/DemoSelectRole";
import DemoArtistDashboard from "./pages/demo/artist/Dashboard";
import DemoArtistShows from "./pages/demo/artist/Shows";
import DemoArtistCalendar from "./pages/demo/artist/Calendar";
import DemoArtistReports from "./pages/demo/artist/Reports";
import DemoArtistTransportation from "./pages/demo/artist/Transportation";
import DemoArtistSupport from "./pages/demo/artist/Support";
import DemoArtistProfile from "./pages/demo/artist/Profile";
import DemoArtistSettings from "./pages/demo/artist/Settings";
import DemoArtistExpenses from "./pages/demo/artist/Expenses";
import DemoArtistInvoiceSimulator from "./pages/demo/artist/InvoiceSimulator";
import DemoMusicianDashboard from "./pages/demo/musician/Dashboard";
import DemoMusicianShows from "./pages/demo/musician/Shows";
import DemoMusicianArtists from "./pages/demo/musician/Artists";
import DemoMusicianCalendar from "./pages/demo/musician/Calendar";
import DemoMusicianReports from "./pages/demo/musician/Reports";
import DemoMusicianTransportation from "./pages/demo/musician/Transportation";
import DemoMusicianSupport from "./pages/demo/musician/Support";
import DemoMusicianProfile from "./pages/demo/musician/Profile";
import DemoMusicianSettings from "./pages/demo/musician/Settings";
import DemoMusicianExpenses from "./pages/demo/musician/Expenses";

const AppRoutes = () => {
  usePixNotificationChecker();
  usePushNotifications();
  useTimezoneSync();
  
  return (
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
      <Route path="/contador" element={<Contador />} />
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
  );
};

const App = () => (
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
);

export default App;
