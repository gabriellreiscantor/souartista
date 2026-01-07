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
    bgColor: "bg-primary/10",
    iconBg: "bg-primary",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-100",
    iconBg: "bg-orange-500",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-emerald-100",
    iconBg: "bg-emerald-500",
  },
  update: {
    icon: Sparkles,
    bgColor: "bg-primary/10",
    iconBg: "bg-primary",
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
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl">
        <DialogHeader className="text-center sm:text-center pt-2">
          <div className="flex justify-center mb-5">
            <div className={`p-4 rounded-full ${config.iconBg} shadow-lg`}>
              <IconComponent className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            {announcement.title}
          </DialogTitle>
          
          <DialogDescription className="text-center pt-3 text-base text-gray-600 whitespace-pre-wrap leading-relaxed">
            {announcement.message}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center pt-6 pb-2">
          <Button 
            onClick={handleDismiss} 
            disabled={loading}
            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            {loading ? "..." : "Entendi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
