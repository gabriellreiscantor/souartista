import { Music, Calendar, LayoutDashboard, BarChart3, Car, Receipt } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

interface DemoMobileBottomNavProps {
  role: 'artist' | 'musician';
}

export function DemoMobileBottomNav({ role }: DemoMobileBottomNavProps) {
  const items = [
    { 
      title: 'Shows', 
      url: `/demo/${role}/shows`, 
      icon: Music 
    },
    { 
      title: 'Calendário', 
      url: `/demo/${role}/calendar`, 
      icon: Calendar 
    },
    { 
      title: 'Dashboard', 
      url: `/demo/${role}/dashboard`, 
      icon: LayoutDashboard 
    },
    { 
      title: 'Relatórios', 
      url: `/demo/${role}/reports`, 
      icon: BarChart3 
    },
    { 
      title: 'Locomoção', 
      url: `/demo/${role}/transportation`, 
      icon: Car 
    },
    { 
      title: 'Despesas', 
      url: `/demo/${role}/expenses`, 
      icon: Receipt 
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[60px]",
              "text-gray-600 hover:text-purple-600"
            )}
            activeClassName="text-purple-600 bg-purple-50"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium leading-tight text-center">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
