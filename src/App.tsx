import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/OfflineBanner";
import { UpdateBanner } from "@/components/UpdateBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { usePixNotificationChecker } from "./hooks/usePixNotificationChecker";
import { usePushNotifications } from "./hooks/usePushNotifications";
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
import MusicianDashboard from "./pages/musician/Dashboard";
import MusicianShows from "./pages/musician/Shows";
import MusicianArtists from "./pages/musician/Artists";
import MusicianCalendar from "./pages/musician/Calendar";
import MusicianReports from "./pages/musician/Reports";
import MusicianTransportation from "./pages/musician/Transportation";
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
import NotFound from "./pages/NotFound";
import DemoSelectRole from "./pages/DemoSelectRole";
import DemoArtistDashboard from "./pages/demo/artist/Dashboard";
import DemoArtistShows from "./pages/demo/artist/Shows";
import DemoArtistCalendar from "./pages/demo/artist/Calendar";
import DemoArtistReports from "./pages/demo/artist/Reports";
import DemoArtistTransportation from "./pages/demo/artist/Transportation";
import DemoArtistSupport from "./pages/demo/artist/Support";
import DemoArtistProfile from "./pages/demo/artist/Profile";
import DemoArtistSettings from "./pages/demo/artist/Settings";
import DemoMusicianDashboard from "./pages/demo/musician/Dashboard";
import DemoMusicianShows from "./pages/demo/musician/Shows";
import DemoMusicianArtists from "./pages/demo/musician/Artists";
import DemoMusicianCalendar from "./pages/demo/musician/Calendar";
import DemoMusicianReports from "./pages/demo/musician/Reports";
import DemoMusicianTransportation from "./pages/demo/musician/Transportation";
import DemoMusicianSupport from "./pages/demo/musician/Support";
import DemoMusicianProfile from "./pages/demo/musician/Profile";
import DemoMusicianSettings from "./pages/demo/musician/Settings";

const queryClient = new QueryClient();

const AppRoutes = () => {
  usePixNotificationChecker(); // Verifica notificações PIX periodicamente
  usePushNotifications(); // Inicializa push notifications nativas
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route path="/app" element={<AppHub />} />
      <Route path="/artist/dashboard" element={<ArtistDashboard />} />
      <Route path="/artist/shows" element={<ArtistShows />} />
      <Route path="/artist/musicians" element={<ArtistMusicians />} />
      <Route path="/artist/venues" element={<ArtistVenues />} />
      <Route path="/artist/calendar" element={<ArtistCalendar />} />
      <Route path="/artist/reports" element={<ArtistReports />} />
      <Route path="/artist/transportation" element={<ArtistTransportation />} />
      <Route path="/artist/support" element={<ArtistSupport />} />
      <Route path="/artist/profile" element={<ArtistProfile />} />
      <Route path="/artist/settings" element={<ArtistSettings />} />
      <Route path="/artist/subscription" element={<ArtistSubscription />} />
      <Route path="/artist/terms" element={<ArtistTerms />} />
      <Route path="/artist/privacy" element={<ArtistPrivacy />} />
      <Route path="/artist/updates" element={<ArtistUpdates />} />
      <Route path="/artist/tutorial" element={<ArtistTutorial />} />
      <Route path="/musician/dashboard" element={<MusicianDashboard />} />
      <Route path="/musician/shows" element={<MusicianShows />} />
      <Route path="/musician/artists" element={<MusicianArtists />} />
      <Route path="/musician/calendar" element={<MusicianCalendar />} />
      <Route path="/musician/reports" element={<MusicianReports />} />
      <Route path="/musician/transportation" element={<MusicianTransportation />} />
      <Route path="/musician/support" element={<MusicianSupport />} />
      <Route path="/musician/profile" element={<MusicianProfile />} />
      <Route path="/musician/settings" element={<MusicianSettings />} />
      <Route path="/musician/subscription" element={<MusicianSubscription />} />
      <Route path="/musician/terms" element={<MusicianTerms />} />
      <Route path="/musician/privacy" element={<MusicianPrivacy />} />
      <Route path="/musician/updates" element={<MusicianUpdates />} />
      <Route path="/musician/tutorial" element={<MusicianTutorial />} />
      <Route path="/admin" element={<Admin />} />
      {/* Demo Routes */}
      <Route path="/demo" element={<DemoSelectRole />} />
      <Route path="/demo/artist/dashboard" element={<DemoArtistDashboard />} />
      <Route path="/demo/artist/shows" element={<DemoArtistShows />} />
      <Route path="/demo/artist/calendar" element={<DemoArtistCalendar />} />
      <Route path="/demo/artist/reports" element={<DemoArtistReports />} />
      <Route path="/demo/artist/transportation" element={<DemoArtistTransportation />} />
      <Route path="/demo/artist/support" element={<DemoArtistSupport />} />
      <Route path="/demo/artist/profile" element={<DemoArtistProfile />} />
      <Route path="/demo/artist/settings" element={<DemoArtistSettings />} />
      <Route path="/demo/musician/dashboard" element={<DemoMusicianDashboard />} />
      <Route path="/demo/musician/shows" element={<DemoMusicianShows />} />
      <Route path="/demo/musician/artists" element={<DemoMusicianArtists />} />
      <Route path="/demo/musician/calendar" element={<DemoMusicianCalendar />} />
      <Route path="/demo/musician/reports" element={<DemoMusicianReports />} />
      <Route path="/demo/musician/transportation" element={<DemoMusicianTransportation />} />
      <Route path="/demo/musician/support" element={<DemoMusicianSupport />} />
      <Route path="/demo/musician/profile" element={<DemoMusicianProfile />} />
      <Route path="/demo/musician/settings" element={<DemoMusicianSettings />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <UpdateBanner />
      {/* Safe area wrapper for iOS native app */}
      <div className="safe-area-status-bar fixed top-0 left-0 right-0 z-[9999]" />
      <div className="safe-area-top">
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
