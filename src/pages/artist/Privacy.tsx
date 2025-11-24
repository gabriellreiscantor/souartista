import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Bell, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ArtistPrivacy = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-white flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
              <Button variant="ghost" size="icon" onClick={() => navigate('/artist/settings')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-black">Política de Privacidade</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5 text-gray-900" />
              </Button>
              <UserMenu userName={userData?.name} userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-3xl mx-auto prose prose-slate prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900">
              <h1 className="text-gray-900">Política de Privacidade</h1>
              <p className="text-gray-600">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

              <h2 className="text-gray-900">1. Informações que Coletamos</h2>
              <p className="text-gray-900">
                Coletamos informações que você nos fornece diretamente, incluindo:
              </p>
              <ul>
                <li className="text-gray-900">Nome, email e telefone</li>
                <li className="text-gray-900">Informações sobre shows e eventos</li>
                <li className="text-gray-900">Dados financeiros relacionados a cachês e despesas</li>
                <li className="text-gray-900">Informações sobre músicos e equipes</li>
              </ul>

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
                Se você tiver dúvidas sobre esta política de privacidade, entre em contato através da seção 
                "Fale Conosco".
              </p>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ArtistPrivacy;
