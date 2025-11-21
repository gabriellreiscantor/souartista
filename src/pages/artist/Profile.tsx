import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ArtistSidebar } from '@/components/ArtistSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Phone, Camera, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
const ArtistProfile = () => {
  const {
    user,
    userData,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setEmail(userData.email || '');
      setPhone(userData.phone || '');
      setPhotoUrl(userData.photo_url || '');
    }
  }, [userData]);
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/profile.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from('profile-photos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      setPhotoUrl(publicUrl);

      // Atualizar no banco
      const {
        error: updateError
      } = await supabase.from('profiles').update({
        photo_url: publicUrl
      }).eq('id', user?.id);
      if (updateError) throw updateError;
      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };
  const handleSaveChanges = async () => {
    if (!name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    try {
      setSaving(true);
      const {
        error
      } = await supabase.from('profiles').update({
        name: name.trim(),
        phone: phone.trim()
      }).eq('id', user?.id);
      if (error) throw error;
      toast.success('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha');
    }
  };
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao sair');
    }
  };
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <ArtistSidebar />
        
        <div className="flex flex-col flex-1 w-full">
          <header className="h-16 border-b border-border bg-card flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-4">
              <UserMenu userName={userData?.name} userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary">
                    <AvatarImage src={photoUrl} />
                    <AvatarFallback className="bg-white text-primary text-3xl">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-5 h-5" />
                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-950">Seu Perfil</h2>
                  <p className="text-muted-foreground">Gerencie suas informações de conta.</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 bg-white border border-border rounded-lg p-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-black">
                    <User className="w-4 h-4" />
                    Nome de Exibição
                  </Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="capitalize bg-white text-black border-gray-300" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-black">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input id="email" type="email" value={email} disabled className="bg-gray-200 text-black cursor-not-allowed border-gray-300" />
                  <p className="text-xs text-gray-600">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-black">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="bg-white text-black border-gray-300" />
                </div>

                <Button onClick={handleSaveChanges} disabled={saving || uploading} className="w-full bg-primary text-white hover:bg-primary/90">
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar Senha</DialogTitle>
                      <DialogDescription>
                        Digite sua nova senha abaixo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Digite novamente" />
                      </div>
                      <Button onClick={handleChangePassword} className="w-full bg-primary text-white hover:bg-primary/90">
                        Confirmar Alteração
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </main>

          <MobileBottomNav role="artist" />
        </div>
      </div>
    </SidebarProvider>;
};
export default ArtistProfile;