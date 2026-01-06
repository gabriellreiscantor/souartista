import { useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';

const MusicianTerms = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <MusicianSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/musician/settings')} className="bg-primary rounded-full p-1.5">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Termos de Uso</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole="musician" photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
            <div className="max-w-3xl mx-auto prose prose-slate">
              <h1 className="text-stone-950">Termos de Uso</h1>
              <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

              <h2 className="text-stone-950 text-xl">1. Aceitação dos Termos</h2>
              <p className="text-zinc-950">
                Ao acessar e usar esta plataforma, você aceita e concorda em estar vinculado aos termos e 
                condições aqui estabelecidos.
              </p>

              <h2 className="text-stone-950 text-xl">2. Uso da Plataforma</h2>
              <p className="text-stone-950">
                Esta plataforma destina-se a ajudar artistas e músicos a gerenciar seus shows, equipes e 
                finanças de forma organizada e eficiente.
              </p>

              <h2 className="text-stone-950 text-xl">3. Conta de Usuário</h2>
              <p className="text-stone-950">
                Você é responsável por manter a confidencialidade de sua conta e senha. Notifique-nos 
                imediatamente sobre qualquer uso não autorizado de sua conta.
              </p>

              <h2 className="text-stone-950 text-xl">4. Propriedade Intelectual</h2>
              <p className="text-stone-950">
                Todo o conteúdo da plataforma, incluindo textos, gráficos, logos e software, é propriedade 
                da empresa e protegido por leis de direitos autorais.
              </p>

              <h2 className="text-stone-950 text-xl">5. Dados e Privacidade</h2>
              <p className="text-stone-950">
                Seus dados são tratados de acordo com nossa Política de Privacidade. Não compartilhamos 
                suas informações pessoais com terceiros sem seu consentimento.
              </p>

              <h2 className="text-xl">6. Limitação de Responsabilidade</h2>
              <p className="text-stone-950">
                A plataforma é fornecida "como está". Não garantimos que o serviço será ininterrupto ou 
                livre de erros.
              </p>

              <h2 className="text-stone-950">7. Modificações nos Termos</h2>
              <p className="text-stone-950">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações entrarão 
                em vigor imediatamente após a publicação.
              </p>

              <h2 className="text-stone-950">8. Termos Adicionais para Compras via App Store (iOS)</h2>
              <p className="text-stone-950">
                Para assinaturas adquiridas através da App Store da Apple, aplicam-se também os termos
                do Contrato de Licença de Usuário Final (EULA) padrão da Apple.
              </p>
              <p className="text-stone-950">
                Ao adquirir uma assinatura pelo iOS, você concorda com ambos os termos: os Termos de Uso
                do SouArtista e o{' '}
                <a
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  EULA da Apple
                </a>.
              </p>

              <h2 className="text-stone-950">9. Contato</h2>
              <p className="text-stone-950">
                Para dúvidas sobre estes termos, entre em contato:{' '}
                <a 
                  href="mailto:contato@souartista.app" 
                  className="text-primary hover:underline font-medium"
                >
                  contato@souartista.app
                </a>
              </p>
            </div>
          </main>

          <MobileBottomNav role="musician" />
        </div>
      </div>
    </SidebarProvider>;
};
export default MusicianTerms;