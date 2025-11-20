import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import SelectRole from "./pages/SelectRole";
import Subscribe from "./pages/Subscribe";
import AppHub from "./pages/AppHub";
import ArtistDashboard from "./pages/artist/Dashboard";
import ArtistShows from "./pages/artist/Shows";
import ArtistCalendar from "./pages/artist/Calendar";
import ArtistReports from "./pages/artist/Reports";
import ArtistTransportation from "./pages/artist/Transportation";
import MusicianDashboard from "./pages/musician/Dashboard";
import MusicianShows from "./pages/musician/Shows";
import MusicianCalendar from "./pages/musician/Calendar";
import MusicianReports from "./pages/musician/Reports";
import MusicianTransportation from "./pages/musician/Transportation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/app" element={<AppHub />} />
            <Route path="/artist/dashboard" element={<ArtistDashboard />} />
            <Route path="/artist/shows" element={<ArtistShows />} />
            <Route path="/artist/calendar" element={<ArtistCalendar />} />
            <Route path="/artist/reports" element={<ArtistReports />} />
            <Route path="/artist/transportation" element={<ArtistTransportation />} />
            <Route path="/musician/dashboard" element={<MusicianDashboard />} />
            <Route path="/musician/shows" element={<MusicianShows />} />
            <Route path="/musician/calendar" element={<MusicianCalendar />} />
            <Route path="/musician/reports" element={<MusicianReports />} />
            <Route path="/musician/transportation" element={<MusicianTransportation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
