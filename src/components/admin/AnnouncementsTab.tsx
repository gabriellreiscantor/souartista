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
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Megaphone className="h-5 w-5" />
            Criar Novo Aviso
          </CardTitle>
          <CardDescription className="text-gray-500">
            Envie um pop-up para todos os usuários do app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Nova funcionalidade!"
                  required
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-gray-900 focus:bg-gray-100">
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
              <Label htmlFor="message" className="text-gray-700">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a mensagem do aviso..."
                rows={4}
                required
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target" className="text-gray-700">Destinatários</Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all" className="text-gray-900 focus:bg-gray-100">Todos os usuários</SelectItem>
                    <SelectItem value="artist" className="text-gray-900 focus:bg-gray-100">Apenas Artistas</SelectItem>
                    <SelectItem value="musician" className="text-gray-900 focus:bg-gray-100">Apenas Músicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires" className="text-gray-700">Expira em (opcional)</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900"
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
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Avisos Enviados</CardTitle>
          <CardDescription className="text-gray-500">
            Gerencie os avisos já enviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Carregando...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
                    className={`p-3 sm:p-4 rounded-lg border border-gray-200 ${
                      announcement.is_active
                        ? "bg-white"
                        : "bg-gray-50 opacity-60"
                    }`}
                  >
                    {/* Header com ícone, título e ações */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`p-1.5 sm:p-2 rounded-full ${typeConfig.color}/20 shrink-0`}>
                          <IconComponent className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${typeConfig.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base text-gray-900 line-clamp-1">{announcement.title}</h4>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(announcement.id, announcement.is_active)}
                          title={announcement.is_active ? "Desativar" : "Ativar"}
                          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Badge variant={announcement.is_active ? "default" : "secondary"} className="text-xs">
                        {announcement.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      {announcement.target_role && (
                        <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                          {announcement.target_role === "artist" ? "Artistas" : "Músicos"}
                        </Badge>
                      )}
                    </div>

                    {/* Mensagem */}
                    <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">
                      {announcement.message}
                    </p>

                    {/* Data */}
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                      {format(new Date(announcement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {announcement.expires_at && (
                        <> • Expira {format(new Date(announcement.expires_at), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </p>
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
