import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <img src={logo} alt="SouArtista" className="h-10 w-auto" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Política de Privacidade</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Informações que Coletamos</h2>
            <p>
              Coletamos informações que você nos fornece diretamente ao criar uma conta,
              incluindo nome, e-mail, telefone e informações de pagamento. Também coletamos
              automaticamente informações sobre seu uso do serviço, como dados de shows,
              receitas e despesas que você registra.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Como Usamos Suas Informações</h2>
            <p>
              Usamos suas informações para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Processar transações e enviar notificações relacionadas</li>
              <li>Responder a seus comentários, perguntas e solicitações de suporte</li>
              <li>Enviar informações técnicas, atualizações e mensagens administrativas</li>
              <li>Monitorar e analisar tendências, uso e atividades</li>
              <li>Personalizar e melhorar o serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Compartilhamento de Informações</h2>
            <p>
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações
              apenas nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Com seu consentimento explícito</li>
              <li>Com provedores de serviços que nos auxiliam na operação do serviço</li>
              <li>Para cumprir obrigações legais ou responder a solicitações governamentais</li>
              <li>Para proteger os direitos, propriedade ou segurança da empresa e usuários</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger
              suas informações pessoais contra acesso não autorizado, alteração, divulgação
              ou destruição. No entanto, nenhum método de transmissão pela Internet ou
              armazenamento eletrônico é 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Retenção de Dados</h2>
            <p>
              Mantemos suas informações pessoais pelo tempo necessário para fornecer nossos
              serviços e cumprir obrigações legais. Você pode solicitar a exclusão de sua
              conta e dados a qualquer momento através das configurações da conta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Seus Direitos</h2>
            <p>
              Você tem o direito de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acessar e receber uma cópia de suas informações pessoais</li>
              <li>Corrigir informações imprecisas ou incompletas</li>
              <li>Solicitar a exclusão de suas informações pessoais</li>
              <li>Opor-se ao processamento de suas informações</li>
              <li>Solicitar a portabilidade de seus dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Cookies e Tecnologias Similares</h2>
            <p>
              Utilizamos cookies e tecnologias similares para coletar informações sobre
              seu uso do serviço e melhorar sua experiência. Você pode controlar o uso
              de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Alterações a Esta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos
              você sobre quaisquer alterações publicando a nova política nesta página e
              atualizando a data da "última atualização".
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Contato</h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos
              suas informações, entre em contato conosco através dos canais de suporte
              disponíveis no aplicativo.
            </p>
          </section>

          <p className="text-sm mt-8">
            Última atualização: Janeiro de 2025
          </p>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
