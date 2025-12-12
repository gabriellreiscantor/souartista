import { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';

const ArtistTerms = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/artist/settings')} className="bg-primary rounded-full p-1.5">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Termos de Uso</h1>
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
            <div className="max-w-3xl mx-auto prose prose-slate prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900">
              <h1 className="text-gray-900">Termos de Uso</h1>
              <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

              <h2 className="text-gray-900">1. Aceitação dos Termos</h2>
              <p className="text-gray-900">
                Ao acessar e usar esta plataforma, você aceita e concorda em estar vinculado aos termos e 
                condições aqui estabelecidos.
              </p>

              <h2 className="text-gray-900">2. Uso da Plataforma</h2>
              <p className="text-gray-900">
                Esta plataforma destina-se a ajudar artistas e músicos a gerenciar seus shows, equipes e 
                finanças de forma organizada e eficiente.
              </p>

              <h2 className="text-gray-900">3. Conta de Usuário</h2>
              <p className="text-gray-900">
                Você é responsável por manter a confidencialidade de sua conta e senha. Notifique-nos 
                imediatamente sobre qualquer uso não autorizado de sua conta.
              </p>

              <h2 className="text-gray-900">4. Propriedade Intelectual</h2>
              <p className="text-gray-900">
                Todo o conteúdo da plataforma, incluindo textos, gráficos, logos e software, é propriedade 
                da empresa e protegido por leis de direitos autorais.
              </p>

              <h2 className="text-gray-900">5. Dados e Privacidade</h2>
              <p className="text-gray-900">
                Seus dados são tratados de acordo com nossa Política de Privacidade. Não compartilhamos 
                suas informações pessoais com terceiros sem seu consentimento.
              </p>

              <h2 className="text-gray-900">6. Limitação de Responsabilidade</h2>
              <p className="text-gray-900">
                A plataforma é fornecida "como está". Não garantimos que o serviço será ininterrupto ou 
                livre de erros.
              </p>

              <h2 className="text-gray-900">7. Modificações nos Termos</h2>
              <p className="text-gray-900">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações entrarão 
                em vigor imediatamente após a publicação.
              </p>

              <h2 className="text-gray-900">8. Contato</h2>
              <p className="text-gray-900">
                Para dúvidas sobre estes termos, entre em contato através da seção "Fale Conosco".
              </p>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistTerms;
