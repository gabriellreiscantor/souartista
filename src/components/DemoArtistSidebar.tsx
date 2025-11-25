import { Home, Calendar, Music, MapPin, DollarSign, TrendingUp, Settings, HelpCircle, Bell, FileText, Truck, LogOut } from "lucide-react";
import { NavLink } from "./NavLink";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/nova_logo.png";

export function DemoArtistSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <img src={logo} alt="Sou Artista" className="h-10 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
        <NavLink to="/demo/artist/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/demo/artist/shows" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
          <Music className="w-4 h-4" />
          <span>Shows</span>
        </NavLink>
        <NavLink to="/demo/artist/calendar" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
          <Calendar className="w-4 h-4" />
          <span>Calendário</span>
        </NavLink>
        <NavLink to="/demo/artist/musicians" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
          <Music className="w-4 h-4" />
          <span>Músicos</span>
        </NavLink>
        <NavLink to="/demo/artist/venues" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
          <MapPin className="w-4 h-4" />
          <span>Locais</span>
        </NavLink>
        <NavLink to="/demo/artist/transportation" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
          <Truck className="w-4 h-4" />
          <span>Locomoção</span>
        </NavLink>
        <NavLink to="/demo/artist/reports" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
          <TrendingUp className="w-4 h-4" />
          <span>Relatórios</span>
        </NavLink>

        <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
          <NavLink to="/demo/artist/updates" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
            <Bell className="w-4 h-4" />
            <span>Atualizações</span>
          </NavLink>
          <NavLink to="/demo/artist/tutorial" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
            <FileText className="w-4 h-4" />
            <span>Tutorial</span>
          </NavLink>
          <NavLink to="/demo/artist/support" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
            <HelpCircle className="w-4 h-4" />
            <span>Suporte</span>
          </NavLink>
          <NavLink to="/demo/artist/settings" className="flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-900" activeClassName="bg-gray-100 text-primary">
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </NavLink>
        </div>
      </nav>

      {/* Exit Demo */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da Demo
        </button>
      </div>
    </aside>
  );
}
