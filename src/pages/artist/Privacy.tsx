import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import { LgpdRequestModal } from '@/components/LgpdRequestModal';

const ArtistPrivacy = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [showLgpdModal, setShowLgpdModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex flex-col flex-1 w-full safe-area-top">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/artist/settings')} className="bg-primary rounded-full p-1.5">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Política de Privacidade</h1>
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
              <h1 className="text-gray-900">Política de Privacidade</h1>
              <p className="text-gray-600">Última atualização: Janeiro de 2026</p>

              <h2 className="text-gray-900">1. Informações que Coletamos</h2>
              <p className="text-gray-900">
                Coletamos informações fornecidas diretamente pelo usuário no momento do cadastro e durante 
                o uso da plataforma, incluindo nome, e-mail, telefone, CPF, data de nascimento, informações 
                de plano e dados relacionados à atividade profissional, como registros de shows, cachês, 
                receitas, despesas e outros dados financeiros inseridos pelo próprio usuário.
              </p>
              <p className="text-gray-900">
                Também coletamos informações técnicas e de uso da plataforma, como datas de acesso, 
                interações com funcionalidades e dados necessários para suporte e segurança.
              </p>

              <h2 className="text-gray-900">2. Como Usamos Suas Informações</h2>
              <p className="text-gray-900">
                Utilizamos suas informações para:
              </p>
              <ul>
                <li className="text-gray-900">Fornecer, manter e melhorar nossos serviços</li>
                <li className="text-gray-900">Processar transações e enviar notificações relacionadas</li>
                <li className="text-gray-900">Enviar comunicações técnicas e atualizações</li>
                <li className="text-gray-900">Responder a seus comentários e perguntas</li>
              </ul>
              <p className="text-gray-900">
                As informações coletadas poderão ser acessadas por administradores autorizados da plataforma 
                exclusivamente para fins de operação, manutenção, suporte ao usuário, análise interna, 
                geração de relatórios, prevenção a fraudes e melhoria contínua do serviço.
              </p>

              <h2 className="text-gray-900">3. Compartilhamento de Informações</h2>
              <p className="text-gray-900">
                Não vendemos ou alugamos suas informações pessoais para terceiros. Podemos compartilhar 
                suas informações apenas nas seguintes circunstâncias:
              </p>
              <ul>
                <li className="text-gray-900">Com seu consentimento explícito</li>
                <li className="text-gray-900">Para cumprir obrigações legais</li>
                <li className="text-gray-900">Com provedores de serviços que nos auxiliam</li>
              </ul>
              <p className="text-gray-900">
                O SouArtista não comercializa dados pessoais. Dados financeiros de pagamento são processados 
                por parceiros externos (como operadoras de pagamento e lojas de aplicativos), não sendo 
                armazenados integralmente em nossos sistemas.
              </p>

              <h2 className="text-gray-900">4. Segurança dos Dados</h2>
              <p className="text-gray-900">
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações 
                contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>

              <h2 className="text-gray-900">5. Seus Direitos</h2>
              <p className="text-gray-900">
                Você tem o direito de:
              </p>
              <ul>
                <li className="text-gray-900">Acessar seus dados pessoais</li>
                <li className="text-gray-900">Corrigir informações incorretas</li>
                <li className="text-gray-900">Solicitar a exclusão de seus dados</li>
                <li className="text-gray-900">Retirar seu consentimento a qualquer momento</li>
              </ul>
              <p className="text-gray-900 mt-2">
                Para exercer seus direitos,{' '}
                <button 
                  onClick={() => setShowLgpdModal(true)}
                  className="text-primary hover:underline font-medium"
                >
                  clique aqui para fazer uma solicitação LGPD
                </button>.
              </p>

              <h2 className="text-gray-900">6. Cookies e Tecnologias Semelhantes</h2>
              <p className="text-gray-900">
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, analisar o uso 
                da plataforma e personalizar conteúdo.
              </p>

              <h2 className="text-gray-900">7. Alterações nesta Política</h2>
              <p className="text-gray-900">
                Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças significativas 
                através da plataforma ou por email.
              </p>

              <h2 className="text-gray-900">8. Contato</h2>
              <p className="text-gray-900">
                Se você tiver dúvidas sobre esta política de privacidade, entre em contato:{' '}
                <a 
                  href="mailto:contato@souartista.app" 
                  className="text-primary hover:underline font-medium"
                >
                  contato@souartista.app
                </a>
              </p>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>

        <LgpdRequestModal open={showLgpdModal} onOpenChange={setShowLgpdModal} />
      </div>
    </SidebarProvider>
  );
};

export default ArtistPrivacy;