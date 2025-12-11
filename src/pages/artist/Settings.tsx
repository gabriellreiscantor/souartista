import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { NotificationBell } from '@/components/NotificationBell';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useReportVisibility } from '@/hooks/useReportVisibility';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, FileText, Shield, MessageCircle, Rocket, BookOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

const ArtistSettings = () => {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings, updateSettings } = useReportVisibility();
  const { toast } = useToast();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSettingChange = (key: string, value: boolean) => {
    updateSettings({ [key]: value });
    toast({
      title: value ? "Configuração ativada" : "Configuração desativada",
      description: "Suas preferências foram salvas com sucesso.",
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'excluir minha conta') {
      toast({
        title: "Erro",
        description: "Digite 'excluir minha conta' para confirmar.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      
      if (error) throw error;

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
      });

      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-black">Ajustes</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="artist" photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ajustes</h2>
                <p className="text-gray-600">Personalize sua experiência na plataforma.</p>
              </div>

              {/* Visibilidade do Dashboard e Relatório */}
              <Card className="p-6 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Visibilidade do Dashboard e Relatório</h3>
                <p className="text-gray-900 text-sm mb-6">
                  Escolha quais valores financeiros você deseja ver. Valores ocultos aparecem como R$ *.***,**
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">Receita Bruta</h4>
                      <p className="text-sm text-gray-900">Exibir a receita total de cachês.</p>
                    </div>
                    <Switch 
                      checked={settings.showGrossRevenue} 
                      onCheckedChange={(checked) => handleSettingChange('showGrossRevenue', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">Custos de Show</h4>
                      <p className="text-sm text-gray-900">
                        Exibir os custos com equipe e outras despesas (exceto locomoção).
                      </p>
                    </div>
                    <Switch 
                      checked={settings.showShowCosts} 
                      onCheckedChange={(checked) => handleSettingChange('showShowCosts', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">Lucro Líquido</h4>
                      <p className="text-sm text-gray-900">
                        Exibir o lucro final após todas as despesas.
                      </p>
                    </div>
                    <Switch 
                      checked={settings.showNetProfit} 
                      onCheckedChange={(checked) => handleSettingChange('showNetProfit', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Locomoção</h4>
                      <p className="text-sm text-gray-900">
                        Exibir as despesas totais com locomoção.
                      </p>
                    </div>
                    <Switch 
                      checked={settings.showLocomotion} 
                      onCheckedChange={(checked) => handleSettingChange('showLocomotion', checked)} 
                    />
                  </div>
                </div>
              </Card>

              {/* Legal */}
              <Card className="p-6 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Legal</h3>
                <p className="text-gray-900 text-sm mb-6">
                  Consulte nossos termos, políticas e outros recursos úteis.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/artist/terms')}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Termos de Uso</h4>
                      <p className="text-sm text-gray-600">
                        Regras e diretrizes para usar a plataforma.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/artist/privacy')}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Política de Privacidade</h4>
                      <p className="text-sm text-gray-600">Como lidamos com seus dados.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/artist/support')}
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-white hover:bg-gray-50 transition-colors text-left border border-gray-200"
                  >
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Fale Conosco</h4>
                      <p className="text-sm text-gray-600">Entre em contato com nosso suporte.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/artist/updates')}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Rocket className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Atualizações</h4>
                      <p className="text-sm text-gray-600">Veja as novidades e melhorias.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/artist/tutorial')}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <BookOpen className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Tutorial</h4>
                      <p className="text-sm text-gray-600">Aprenda a usar os recursos.</p>
                    </div>
                  </button>
                </div>
              </Card>

              {/* Excluir Conta */}
              <Card className="p-6 bg-white border-red-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Zona de Perigo</h3>
                <p className="text-gray-600 text-sm mb-6">
                  A exclusão da conta é permanente e não pode ser desfeita.
                </p>

                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600 text-xl">⚠️ ATENÇÃO: Ação Irreversível</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="font-bold text-red-900 mb-2">
                            Ao excluir sua conta, TODOS os seus dados serão perdidos PERMANENTEMENTE:
                          </p>
                          <ul className="text-sm text-red-800 space-y-1 ml-4">
                            <li>• Todos os seus shows cadastrados</li>
                            <li>• Seus músicos e equipe</li>
                            <li>• Locais e venues salvos</li>
                            <li>• Despesas de locomoção registradas</li>
                            <li>• Sua assinatura ativa (sem reembolso)</li>
                            <li>• Configurações e preferências</li>
                            <li>• Relatórios e histórico financeiro</li>
                          </ul>
                          <p className="font-bold text-red-900 mt-3">
                            Esta ação NÃO PODE ser desfeita. Seus dados não poderão ser recuperados.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-gray-900">
                            Digite "excluir minha conta" para confirmar:
                          </p>
                          <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="excluir minha conta"
                            className="w-full"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                        Cancelar
                      </AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'excluir minha conta' || isDeleting}
                      >
                        {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistSettings;
