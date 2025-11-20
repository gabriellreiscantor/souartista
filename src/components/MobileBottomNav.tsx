import { Music, Calendar, LayoutDashboard, BarChart3, Car } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  role: 'artist' | 'musician';
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const items = [
    { 
      title: 'Shows', 
      url: `/${role}/shows`, 
      icon: Music 
    },
    { 
      title: 'Calendário', 
      url: `/${role}/calendar`, 
      icon: Calendar 
    },
    { 
      title: 'Dashboard', 
      url: `/${role}/dashboard`, 
      icon: LayoutDashboard 
    },
    { 
      title: 'Relatórios', 
      url: `/${role}/reports`, 
      icon: BarChart3 
    },
    { 
      title: 'Locomoção', 
      url: `/${role}/transportation`, 
      icon: Car 
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
              "text-gray-600 hover:text-purple-600"
            )}
            activeClassName="text-purple-600 bg-purple-50"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
