import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Megaphone, Trash2, Info, AlertTriangle, CheckCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  target_role: string | null;
  created_at: string;
  expires_at: string | null;
}

const typeOptions = [
  { value: "info", label: "Informação", icon: Info, color: "bg-blue-500" },
  { value: "warning", label: "Aviso", icon: AlertTriangle, color: "bg-orange-500" },
  { value: "success", label: "Sucesso", icon: CheckCircle, color: "bg-green-500" },
  { value: "update", label: "Atualização", icon: Sparkles, color: "bg-purple-500" },
];

export const AnnouncementsTab = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [targetRole, setTargetRole] = useState("all");
  const [expiresAt, setExpiresAt] = useState("");

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("system_announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
      return;
    }

    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("system_announcements").insert({
        title: title.trim(),
        message: message.trim(),
        type,
        target_role: targetRole === "all" ? null : targetRole,
        expires_at: expiresAt || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Aviso enviado com sucesso!");
      setTitle("");
      setMessage("");
      setType("info");
      setTargetRole("all");
      setExpiresAt("");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Erro ao criar aviso");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("system_announcements")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(currentStatus ? "Aviso desativado" : "Aviso ativado");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error toggling announcement:", error);
      toast.error("Erro ao atualizar aviso");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aviso?")) return;

    try {
      const { error } = await supabase
        .from("system_announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Aviso excluído");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Erro ao excluir aviso");
    }
  };

  const getTypeConfig = (typeValue: string) => {
    return typeOptions.find((t) => t.value === typeValue) || typeOptions[0];
  };

  return (
    <div className="space-y-6">
      {/* Form para criar novo aviso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Criar Novo Aviso
          </CardTitle>
          <CardDescription>
            Envie um pop-up para todos os usuários do app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Nova funcionalidade!"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a mensagem do aviso..."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target">Destinatários</Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="artist">Apenas Artistas</SelectItem>
                    <SelectItem value="musician">Apenas Músicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expira em (opcional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Enviando..." : "Enviar Aviso"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de avisos */}
      <Card>
        <CardHeader>
          <CardTitle>Avisos Enviados</CardTitle>
          <CardDescription>
            Gerencie os avisos já enviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aviso enviado ainda
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const typeConfig = getTypeConfig(announcement.type);
                const IconComponent = typeConfig.icon;

                return (
                  <div
                    key={announcement.id}
                    className={`p-4 rounded-lg border ${
                      announcement.is_active
                        ? "bg-card"
                        : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full ${typeConfig.color}/20`}>
                          <IconComponent className={`h-4 w-4 ${typeConfig.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium truncate">{announcement.title}</h4>
                            <Badge variant={announcement.is_active ? "default" : "secondary"}>
                              {announcement.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            {announcement.target_role && (
                              <Badge variant="outline">
                                {announcement.target_role === "artist" ? "Artistas" : "Músicos"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {announcement.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Criado em {format(new Date(announcement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            {announcement.expires_at && (
                              <> • Expira em {format(new Date(announcement.expires_at), "dd/MM/yyyy", { locale: ptBR })}</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(announcement.id, announcement.is_active)}
                          title={announcement.is_active ? "Desativar" : "Ativar"}
                        >
                          {announcement.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAnnouncement(announcement.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
