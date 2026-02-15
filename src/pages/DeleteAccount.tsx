import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo.png';

const DeleteAccount = () => {
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
        <h1 className="text-4xl font-bold mb-8 text-foreground">Exclusão de Conta</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. O que acontece ao excluir sua conta</h2>
            <p>
              Ao solicitar a exclusão da sua conta no SouArtista, <strong className="text-foreground">todos os seus dados serão
              apagados permanentemente</strong> dos nossos servidores. Esta ação é irreversível e não pode ser desfeita.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Dados que serão excluídos</h2>
            <p>
              Os seguintes dados serão permanentemente removidos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Perfil e informações pessoais (nome, e-mail, telefone, CPF, foto)</li>
              <li>Shows e histórico de apresentações</li>
              <li>Músicos e equipe cadastrados</li>
              <li>Locais (venues) cadastrados</li>
              <li>Despesas e registros financeiros</li>
              <li>Dados de transporte e locomoção</li>
              <li>Assinatura e histórico de pagamentos</li>
              <li>Tickets de suporte e mensagens</li>
              <li>Notificações e preferências</li>
              <li>Códigos de indicação e referências</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Como excluir sua conta pelo app</h2>
            <p>
              Siga o passo a passo abaixo para excluir sua conta diretamente pelo aplicativo:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Abra o app SouArtista e faça login na sua conta</li>
              <li>Acesse o menu <strong className="text-foreground">Ajustes</strong> (ícone de engrenagem)</li>
              <li>Role até a seção <strong className="text-foreground">Zona de Perigo</strong></li>
              <li>Toque em <strong className="text-foreground">Excluir Conta</strong></li>
              <li>Digite <strong className="text-foreground">"excluir minha conta"</strong> para confirmar</li>
              <li>Confirme a exclusão</li>
            </ol>
            <p className="mt-4">
              A exclusão é processada imediatamente após a confirmação.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Alternativa: solicitar por e-mail</h2>
            <p>
              Caso não consiga acessar o aplicativo, você pode solicitar a exclusão da sua conta
              enviando um e-mail para:{' '}
              <a
                href="mailto:contato@souartista.app"
                className="text-primary hover:underline font-medium"
              >
                contato@souartista.app
              </a>
            </p>
            <p className="mt-2">
              Inclua no e-mail o endereço de e-mail cadastrado na sua conta para que possamos
              identificá-lo e processar a solicitação.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Prazo de exclusão</h2>
            <p>
              A exclusão da conta e de todos os dados associados é realizada <strong className="text-foreground">imediatamente</strong> quando
              feita pelo aplicativo. Solicitações por e-mail serão processadas em até 5 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Contato</h2>
            <p>
              Em caso de dúvidas sobre a exclusão de conta ou tratamento de dados, entre em contato:{' '}
              <a
                href="mailto:contato@souartista.app"
                className="text-primary hover:underline font-medium"
              >
                contato@souartista.app
              </a>
            </p>
          </section>

          <p className="text-sm mt-8">
            Última atualização: Fevereiro de 2026
          </p>
        </div>
      </main>
    </div>
  );
};

export default DeleteAccount;
