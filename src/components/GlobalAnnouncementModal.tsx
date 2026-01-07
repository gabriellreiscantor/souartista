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
    gradientFrom: "from-blue-500",
    gradientTo: "to-cyan-400",
    bgGlow: "bg-blue-500/20",
    shadowColor: "shadow-blue-500/25",
  },
  warning: {
    icon: AlertTriangle,
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-400",
    bgGlow: "bg-orange-500/20",
    shadowColor: "shadow-orange-500/25",
  },
  success: {
    icon: CheckCircle,
    gradientFrom: "from-emerald-500",
    gradientTo: "to-green-400",
    bgGlow: "bg-emerald-500/20",
    shadowColor: "shadow-emerald-500/25",
  },
  update: {
    icon: Sparkles,
    gradientFrom: "from-violet-500",
    gradientTo: "to-purple-400",
    bgGlow: "bg-violet-500/20",
    shadowColor: "shadow-violet-500/25",
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
      <DialogContent className="sm:max-w-md overflow-hidden border-0 shadow-2xl">
        {/* Background glow effect */}
        <div className={`absolute inset-0 ${config.bgGlow} blur-3xl opacity-50 -z-10`} />
        
        <DialogHeader className="text-center sm:text-center pt-2">
          <div className="flex justify-center mb-5">
            <div className="relative">
              {/* Animated glow ring */}
              <div className={`absolute inset-0 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} rounded-full blur-lg opacity-60 animate-pulse`} />
              
              {/* Icon container */}
              <div className={`relative p-5 rounded-full bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} shadow-xl ${config.shadowColor}`}>
                <IconComponent className="h-8 w-8 text-white drop-shadow-md" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {announcement.title}
          </DialogTitle>
          
          <DialogDescription className="text-center pt-3 text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {announcement.message}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center pt-6 pb-2">
          <Button 
            onClick={handleDismiss} 
            disabled={loading}
            className={`w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} hover:opacity-90 transition-all duration-300 shadow-lg ${config.shadowColor} hover:shadow-xl hover:scale-[1.02]`}
          >
            {loading ? "..." : "Entendi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
