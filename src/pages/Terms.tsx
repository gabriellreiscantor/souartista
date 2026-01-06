import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

const Terms = () => {
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
        <h1 className="text-4xl font-bold mb-8 text-foreground">Termos de Uso</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o SouArtista, você aceita e concorda em ficar vinculado aos termos
              e condições deste acordo. Se você não concordar com qualquer parte destes termos,
              não deve usar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Descrição do Serviço</h2>
            <p>
              O SouArtista é uma plataforma de gerenciamento financeiro para artistas e músicos,
              oferecendo ferramentas para organizar shows, controlar receitas e despesas, e
              gerenciar equipes musicais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Cadastro e Conta</h2>
            <p>
              Para usar o SouArtista, você deve criar uma conta fornecendo informações precisas
              e completas. Você é responsável por manter a confidencialidade de sua senha e
              por todas as atividades que ocorram em sua conta.
            </p>
            <p className="mt-2">
              <strong>Idade mínima:</strong> É necessário ter no mínimo 14 (quatorze) anos de idade
              para criar uma conta no SouArtista. Menores de 14 anos não estão autorizados a utilizar
              o serviço. Caso você tenha entre 14 e 18 anos, recomendamos que obtenha permissão de
              um responsável legal antes de se cadastrar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Acesso Administrativo e Uso de Dados</h2>
            <p>
              Para fins de operação, suporte, segurança, análise e gestão da plataforma, os administradores 
              do SouArtista (incluindo perfis de CEO, COO ou funções equivalentes) poderão acessar dados 
              cadastrais e operacionais dos usuários, tais como nome, e-mail, telefone, CPF, informações 
              de plano, bem como dados financeiros inseridos na plataforma relacionados à atividade 
              profissional do usuário, incluindo registros de shows, cachês, receitas, despesas e 
              indicadores financeiros agregados.
            </p>
            <p className="mt-2">
              O SouArtista não acessa senhas, códigos de autenticação, dados completos de cartões de 
              crédito ou informações bancárias sensíveis, os quais são processados exclusivamente por 
              parceiros de pagamento externos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Uso Aceitável</h2>
            <p>
              Você concorda em usar o serviço apenas para fins legítimos e de acordo com estes
              Termos. Você não deve usar o serviço de maneira que possa danificar, desabilitar,
              sobrecarregar ou prejudicar nossos servidores ou redes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, recursos e funcionalidades do SouArtista são de propriedade
              exclusiva da empresa e são protegidos por leis de direitos autorais, marcas
              registradas e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Pagamentos e Assinaturas</h2>
            <p>
              O acesso a determinados recursos pode exigir uma assinatura paga. Você concorda
              em fornecer informações de pagamento precisas e atualizadas. As taxas de assinatura
              são cobradas antecipadamente e não são reembolsáveis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Cancelamento</h2>
            <p>
              Você pode cancelar sua conta a qualquer momento através das configurações da sua
              conta. Reservamo-nos o direito de suspender ou encerrar sua conta se você violar
              estes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Limitação de Responsabilidade</h2>
            <p>
              O SouArtista é fornecido "como está" sem garantias de qualquer tipo. Não seremos
              responsáveis por quaisquer danos diretos, indiretos, incidentais ou consequenciais
              resultantes do uso ou da incapacidade de usar o serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Alterações aos Termos</h2>
            <p>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. Notificaremos
              você sobre quaisquer alterações publicando os novos Termos nesta página. É sua
              responsabilidade revisar estes Termos periodicamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Termos Adicionais para Compras via App Store (iOS)</h2>
            <p>
              Para assinaturas adquiridas através da App Store da Apple, aplicam-se também os termos
              do Contrato de Licença de Usuário Final (EULA) padrão da Apple.
            </p>
            <p className="mt-2">
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
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Contato</h2>
            <p>
              Se você tiver dúvidas sobre estes Termos, entre em contato conosco:{' '}
              <a 
                href="mailto:contato@souartista.app" 
                className="text-primary hover:underline font-medium"
              >
                contato@souartista.app
              </a>
            </p>
          </section>

          <p className="text-sm mt-8">
            Última atualização: Janeiro de 2026
          </p>
        </div>
      </main>
    </div>
  );
};

export default Terms;