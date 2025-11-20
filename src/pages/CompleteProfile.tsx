import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Music, Loader2 } from 'lucide-react';

const CompleteProfile = () => {
  const [loading, setLoading] = useState(false);
  const { userData, updateUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cpf: userData?.cpf || '',
    birthDate: userData?.birth_date || '',
    phone: userData?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cpf || !formData.birthDate || !formData.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    await updateUserData({
      cpf: formData.cpf,
      birth_date: formData.birthDate,
      phone: formData.phone,
    });

    toast({
      title: 'Perfil atualizado!',
      description: 'Suas informações foram salvas',
    });

    navigate('/app');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Music className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-heading font-bold">Sou Artista</span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-heading font-bold">Complete seu cadastro</h1>
            <p className="text-muted-foreground">
              Precisamos de mais algumas informações
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
