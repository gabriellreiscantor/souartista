import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Route {
  path: string;
  label: string;
  category: 'artist' | 'musician';
  description: string;
}

const routes: Route[] = [
  // Rotas de Artista
  { path: '/artist/dashboard', label: 'Dashboard', category: 'artist', description: 'Página inicial do artista' },
  { path: '/artist/shows', label: 'Shows', category: 'artist', description: 'Gerenciar shows' },
  { path: '/artist/calendar', label: 'Calendário', category: 'artist', description: 'Calendário de eventos' },
  { path: '/artist/musicians', label: 'Músicos', category: 'artist', description: 'Gerenciar músicos' },
  { path: '/artist/venues', label: 'Casas de Show', category: 'artist', description: 'Gerenciar locais' },
  { path: '/artist/transportation', label: 'Transporte', category: 'artist', description: 'Despesas de locomoção' },
  { path: '/artist/reports', label: 'Relatórios', category: 'artist', description: 'Relatórios financeiros' },
  { path: '/artist/profile', label: 'Perfil', category: 'artist', description: 'Editar perfil' },
  { path: '/artist/settings', label: 'Configurações', category: 'artist', description: 'Configurações da conta' },
  { path: '/artist/support', label: 'Suporte', category: 'artist', description: 'Central de ajuda' },
  { path: '/artist/tutorial', label: 'Tutorial', category: 'artist', description: 'Guia de uso' },
  { path: '/artist/updates', label: 'Atualizações', category: 'artist', description: 'Novidades do app' },
  { path: '/artist/privacy', label: 'Privacidade', category: 'artist', description: 'Política de privacidade' },
  { path: '/artist/terms', label: 'Termos', category: 'artist', description: 'Termos de uso' },
  
  // Rotas de Músico
  { path: '/musician/dashboard', label: 'Dashboard', category: 'musician', description: 'Página inicial do músico' },
  { path: '/musician/shows', label: 'Shows', category: 'musician', description: 'Participações em shows' },
  { path: '/musician/calendar', label: 'Calendário', category: 'musician', description: 'Calendário de eventos' },
  { path: '/musician/artists', label: 'Artistas', category: 'musician', description: 'Artistas que trabalho' },
  { path: '/musician/transportation', label: 'Transporte', category: 'musician', description: 'Despesas de locomoção' },
  { path: '/musician/reports', label: 'Relatórios', category: 'musician', description: 'Relatórios financeiros' },
  { path: '/musician/profile', label: 'Perfil', category: 'musician', description: 'Editar perfil' },
  { path: '/musician/settings', label: 'Configurações', category: 'musician', description: 'Configurações da conta' },
  { path: '/musician/support', label: 'Suporte', category: 'musician', description: 'Central de ajuda' },
  { path: '/musician/tutorial', label: 'Tutorial', category: 'musician', description: 'Guia de uso' },
  { path: '/musician/updates', label: 'Atualizações', category: 'musician', description: 'Novidades do app' },
  { path: '/musician/privacy', label: 'Privacidade', category: 'musician', description: 'Política de privacidade' },
  { path: '/musician/terms', label: 'Termos', category: 'musician', description: 'Termos de uso' },
];

interface RouteSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRoute: (path: string) => void;
}

export function RouteSelector({ open, onOpenChange, onSelectRoute }: RouteSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'artist' | 'musician'>('all');

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         route.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || route.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSelectRoute = (path: string) => {
    onSelectRoute(path);
    onOpenChange(false);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Selecionar Página para Redirecionar</DialogTitle>
          <DialogDescription>
            Busque e selecione uma página do sistema para redirecionar o usuário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar página..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white text-gray-900 border-gray-200"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                selectedCategory === 'all' && 'bg-purple-600 text-white hover:bg-purple-700'
              )}
            >
              Todas
            </Button>
            <Button
              variant={selectedCategory === 'artist' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('artist')}
              className={cn(
                selectedCategory === 'artist' && 'bg-purple-600 text-white hover:bg-purple-700'
              )}
            >
              Artistas
            </Button>
            <Button
              variant={selectedCategory === 'musician' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('musician')}
              className={cn(
                selectedCategory === 'musician' && 'bg-purple-600 text-white hover:bg-purple-700'
              )}
            >
              Músicos
            </Button>
          </div>

          {/* Lista de Rotas */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {filteredRoutes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma página encontrada</p>
            ) : (
              filteredRoutes.map((route) => (
                <button
                  key={route.path}
                  onClick={() => handleSelectRoute(route.path)}
                  className="w-full p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-purple-100 transition-colors">
                      <LinkIcon className="w-4 h-4 text-gray-600 group-hover:text-purple-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{route.label}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          route.category === 'artist' 
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        )}>
                          {route.category === 'artist' ? 'Artista' : 'Músico'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{route.description}</p>
                      <p className="text-xs text-gray-500 font-mono">{route.path}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
