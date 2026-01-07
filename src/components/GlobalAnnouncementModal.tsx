import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Info, AlertTriangle, CheckCircle, Sparkles, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "update";
  target_role: string | null;
  created_at: string;
}

const typeConfig = {
  info: {
    icon: Info,
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    iconClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-800",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    iconClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-200 dark:border-orange-800",
  },
  success: {
    icon: CheckCircle,
    bgClass: "bg-green-100 dark:bg-green-900/30",
    iconClass: "text-green-600 dark:text-green-400",
    borderClass: "border-green-200 dark:border-green-800",
  },
  update: {
    icon: Sparkles,
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    iconClass: "text-purple-600 dark:text-purple-400",
    borderClass: "border-purple-200 dark:border-purple-800",
  },
};

export const GlobalAnnouncementModal = () => {
  const { user, userRole } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAnnouncement = async () => {
      // Buscar avisos ativos que o usuário ainda não fechou
      const { data: dismissedIds } = await supabase
        .from("announcement_dismissed")
        .select("announcement_id")
        .eq("user_id", user.id);

      const dismissedList = dismissedIds?.map((d) => d.announcement_id) || [];

      let query = supabase
        .from("system_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      // Filtrar por expiração
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      const { data: announcements } = await query;

      if (announcements && announcements.length > 0) {
        // Filtrar avisos não dispensados e que correspondem ao role do usuário
        const validAnnouncement = announcements.find((a) => {
          // Já foi fechado?
          if (dismissedList.includes(a.id)) return false;
          
          // Verifica role
          if (a.target_role === null) return true;
          if (a.target_role === userRole) return true;
          
          return false;
        });

        if (validAnnouncement) {
          setAnnouncement(validAnnouncement as Announcement);
          setOpen(true);
        }
      }
    };

    fetchAnnouncement();
  }, [user, userRole]);

  const handleDismiss = async () => {
    if (!announcement || !user) return;

    setLoading(true);
    try {
      await supabase.from("announcement_dismissed").insert({
        announcement_id: announcement.id,
        user_id: user.id,
      });
      setOpen(false);
      setAnnouncement(null);
    } catch (error) {
      console.error("Error dismissing announcement:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!announcement) return null;

  const config = typeConfig[announcement.type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${config.bgClass} ${config.borderClass} border-2`}>
              <IconComponent className={`h-8 w-8 ${config.iconClass}`} />
            </div>
          </div>
          <DialogTitle className="text-xl text-center">{announcement.title}</DialogTitle>
          <DialogDescription className="text-center pt-2 whitespace-pre-wrap">
            {announcement.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-4">
          <Button 
            onClick={handleDismiss} 
            disabled={loading}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {loading ? "..." : "Entendi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
