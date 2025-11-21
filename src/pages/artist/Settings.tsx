import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Sun, Moon, FileText, Shield, MessageCircle, Rocket, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ArtistSettings = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  
  const [showGrossRevenue, setShowGrossRevenue] = useState(true);
  const [showShowCosts, setShowShowCosts] = useState(true);
  const [showNetProfit, setShowNetProfit] = useState(true);
  const [showLocomotion, setShowLocomotion] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ajustes</h2>
                <p className="text-gray-600">Personalize sua experiência na plataforma.</p>
              </div>

              {/* Visibilidade do Relatório */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Visibilidade do Relatório</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Escolha quais informações financeiras você deseja ver na página de Relatórios.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">Receita Bruta</h4>
                      <p className="text-sm text-gray-600">Exibir a receita total de cachês.</p>
                    </div>
                    <Switch checked={showGrossRevenue} onCheckedChange={setShowGrossRevenue} />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">Custos de Show</h4>
                      <p className="text-sm text-gray-600">
                        Exibir os custos com equipe e outras despesas (exceto locomoção).
                      </p>
                    </div>
                    <Switch checked={showShowCosts} onCheckedChange={setShowShowCosts} />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-semibold text-gray-900">Lucro Líquido</h4>
                      <p className="text-sm text-gray-600">
                        Exibir o lucro final após todas as despesas.
                      </p>
                    </div>
                    <Switch checked={showNetProfit} onCheckedChange={setShowNetProfit} />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">Locomoção</h4>
                      <p className="text-sm text-gray-600">
                        Exibir as despesas totais com locomoção.
                      </p>
                    </div>
                    <Switch checked={showLocomotion} onCheckedChange={setShowLocomotion} />
                  </div>
                </div>
              </Card>

              {/* Aparência */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aparência</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Customize a aparência do aplicativo.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-semibold">Claro</p>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-semibold">Escuro</p>
                  </button>
                </div>
              </Card>

              {/* Legal */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Legal</h3>
                <p className="text-gray-600 text-sm mb-6">
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
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-pink-500 hover:bg-pink-600 transition-colors text-left text-white"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">Fale Conosco</h4>
                      <p className="text-sm text-pink-100">Entre em contato com nosso suporte.</p>
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
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistSettings;
