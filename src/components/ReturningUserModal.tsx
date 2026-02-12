import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Music, Calendar, DollarSign } from 'lucide-react';
import logoIcon from '@/assets/logo_icon.png';

interface UserStats {
  totalShows: number;
  totalRevenue: number;
  totalMusicians?: number;
  totalArtists?: number;
  expirationDate?: string;
}

interface ReturningUserModalProps {
  open: boolean;
  onClose: () => void;
  stats: UserStats;
  userRole: 'artist' | 'musician' | null;
}

export const ReturningUserModal = ({ open, onClose, stats, userRole }: ReturningUserModalProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img src={logoIcon} alt="SouArtista" className="w-12 h-12" />
          </div>
          <DialogTitle className="text-center text-2xl text-gray-900">
            Que bom ter você de volta! 🎉
          </DialogTitle>
          <DialogDescription className="text-center space-y-2 pt-2">
            <p className="text-base text-gray-700">
              Sua assinatura expirou{stats.expirationDate ? ` em ${formatDate(stats.expirationDate)}` : ''}, mas seus dados estão seguros conosco.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-500 text-center font-medium">
            📊 Seus números:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-gray-900">{stats.totalShows}</p>
                <p className="text-xs text-gray-500">shows cadastrados</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">em receitas</p>
              </div>
            </div>

            {userRole === 'artist' && stats.totalMusicians !== undefined && stats.totalMusicians > 0 && (
              <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold text-gray-900">{stats.totalMusicians}</p>
                  <p className="text-xs text-gray-500">músicos na sua equipe</p>
                </div>
              </div>
            )}

            {userRole === 'musician' && stats.totalArtists !== undefined && stats.totalArtists > 0 && (
              <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold text-gray-900">{stats.totalArtists}</p>
                  <p className="text-xs text-gray-500">artistas vinculados</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            Renove sua assinatura e continue organizando sua carreira musical.
          </p>
        </div>

        <Button onClick={onClose} className="w-full">
          Renovar Assinatura
        </Button>
      </DialogContent>
    </Dialog>
  );
};
