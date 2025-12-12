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

const MusicianPrivacy = () => {
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
              <h1 className="text-xl font-semibold text-black">Política de Privacidade</h1>
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
              <h1 className="text-stone-950">Política de Privacidade</h1>
              <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

              <h2 className="text-stone-950">1. Informações que Coletamos</h2>
              <p className="text-stone-950">
                Coletamos informações que você nos fornece diretamente, incluindo:
              </p>
              <ul>
                <li className="text-stone-950">Nome, email e telefone</li>
                <li className="text-stone-950">Informações sobre shows e eventos</li>
                <li className="text-stone-950">Dados financeiros relacionados a cachês e despesas</li>
                <li className="text-stone-950">Informações sobre músicos e equipes</li>
              </ul>

              <h2 className="text-stone-950">2. Como Usamos Suas Informações</h2>
              <p className="text-stone-950">
                Utilizamos suas informações para:
              </p>
              <ul>
                <li className="text-stone-950">Fornecer, manter e melhorar nossos serviços</li>
                <li className="text-stone-950">Processar transações e enviar notificações relacionadas</li>
                <li className="text-stone-950">Enviar comunicações técnicas e atualizações</li>
                <li className="text-stone-950">Responder a seus comentários e perguntas</li>
              </ul>

              <h2 className="text-stone-950">3. Compartilhamento de Informações</h2>
              <p className="text-stone-950">
                Não vendemos ou alugamos suas informações pessoais para terceiros. Podemos compartilhar 
                suas informações apenas nas seguintes circunstâncias:
              </p>
              <ul>
                <li className="text-stone-950">Com seu consentimento explícito</li>
                <li className="text-stone-950">Para cumprir obrigações legais</li>
                <li className="text-stone-950">Com provedores de serviços que nos auxiliam</li>
              </ul>

              <h2 className="text-stone-950">4. Segurança dos Dados</h2>
              <p className="text-stone-950">
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações 
                contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>

              <h2 className="text-stone-950">5. Seus Direitos</h2>
              <p className="text-stone-950">
                Você tem o direito de:
              </p>
              <ul>
                <li className="text-stone-950">Acessar seus dados pessoais</li>
                <li className="text-stone-950">Corrigir informações incorretas</li>
                <li className="text-stone-950">Solicitar a exclusão de seus dados</li>
                <li className="text-stone-950">Retirar seu consentimento a qualquer momento</li>
              </ul>

              <h2 className="text-stone-950">6. Cookies e Tecnologias Semelhantes</h2>
              <p className="text-stone-950">
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, analisar o uso 
                da plataforma e personalizar conteúdo.
              </p>

              <h2 className="text-stone-950">7. Alterações nesta Política</h2>
              <p className="text-stone-950">
                Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças significativas 
                através da plataforma ou por email.
              </p>

              <h2 className="text-stone-950">8. Contato</h2>
              <p className="text-stone-950">
                Se você tiver dúvidas sobre esta política de privacidade, entre em contato através da seção 
                "Fale Conosco".
              </p>
            </div>
          </main>

          <MobileBottomNav role="musician" />
        </div>
      </div>
    </SidebarProvider>;
};
export default MusicianPrivacy;