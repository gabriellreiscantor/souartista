import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Smartphone, Bell, Layout, RefreshCw, Info, AlertTriangle, CheckCircle, Sparkles, Lock, WifiOff, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { DemoLockedModal } from "@/components/DemoLockedModal";
import Onboarding from "@/components/Onboarding";
import { LoadingScreen } from "@/components/LoadingScreen";

// Debug version of UpdateBanner modal
const DebugUpdateModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md bg-white border border-gray-200">
      <DialogHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-emerald-500 shadow-lg">
            <RefreshCw className="h-8 w-8 text-white" />
          </div>
        </div>
        <DialogTitle className="text-2xl font-bold text-center text-gray-900">
          Nova versão disponível!
        </DialogTitle>
        <DialogDescription className="text-center pt-2 text-gray-600">
          A versão <strong className="text-gray-900">2.0.0</strong> está disponível. Atualize agora para ter acesso às novidades.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-4">
        <Button onClick={() => onOpenChange(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
          Atualizar
        </Button>
        <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-gray-600">
          Depois
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Debug version of GlobalAnnouncementModal
const typeConfig = {
  info: { icon: Info, bgColor: "bg-blue-100", iconBg: "bg-blue-500" },
  warning: { icon: AlertTriangle, bgColor: "bg-orange-100", iconBg: "bg-orange-500" },
  success: { icon: CheckCircle, bgColor: "bg-emerald-100", iconBg: "bg-emerald-500" },
  update: { icon: Sparkles, bgColor: "bg-purple-100", iconBg: "bg-purple-500" },
};

const DebugAnnouncementModal = ({ 
  open, 
  onOpenChange, 
  type 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  type: "info" | "warning" | "success" | "update";
}) => {
  const config = typeConfig[type];
  const IconComponent = config.icon;
  
  const messages = {
    info: { title: "Informação Importante", message: "Esta é uma mensagem informativa para os usuários do sistema." },
    warning: { title: "Atenção", message: "Esta é uma mensagem de aviso importante que requer atenção." },
    success: { title: "Sucesso!", message: "Operação realizada com sucesso. Parabéns!" },
    update: { title: "Novidades no App", message: "Confira as novas funcionalidades que adicionamos para você!" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200">
        <DialogHeader className="text-center pt-2">
          <div className="flex justify-center mb-5">
            <div className={`p-4 rounded-full ${config.iconBg} shadow-lg`}>
              <IconComponent className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            {messages[type].title}
          </DialogTitle>
          <DialogDescription className="text-center pt-3 text-base text-gray-600">
            {messages[type].message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center pt-6 pb-2">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-semibold bg-gray-800 hover:bg-gray-700 text-white"
          >
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Debug version of ReturningUserModal
const DebugReturningUserModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md bg-white border border-gray-200">
      <DialogHeader className="text-center pt-2">
        <div className="flex justify-center mb-5">
          <div className="p-4 rounded-full bg-purple-500 shadow-lg">
            <UserCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <DialogTitle className="text-2xl font-bold text-center text-gray-900">
          Bem-vindo de volta!
        </DialogTitle>
        <DialogDescription className="text-center pt-3 text-base text-gray-600">
          Sua assinatura expirou em <strong>15/01/2025</strong>. Confira o que você conquistou:
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-2 gap-4 py-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">47</p>
          <p className="text-sm text-gray-600">Shows</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">R$ 23.450</p>
          <p className="text-sm text-gray-600">Faturado</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">12</p>
          <p className="text-sm text-gray-600">Músicos</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-600">Casas</p>
        </div>
      </div>
      
      <DialogFooter className="pt-2 pb-2">
        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full h-12 text-base font-semibold bg-gray-800 hover:bg-gray-700 text-white"
        >
          Renovar Assinatura
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// Debug Offline Banner
const DebugOfflineBanner = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
  if (!show) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Você está offline</span>
      <button onClick={onClose} className="ml-4 text-white/80 hover:text-white text-sm underline">
        Fechar
      </button>
    </div>
  );
};

export default function Debug() {
  const navigate = useNavigate();
  
  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success" | "update">("info");
  const [showReturningUserModal, setShowReturningUserModal] = useState(false);
  const [showDemoLockedModal, setShowDemoLockedModal] = useState(false);
  
  // Screen states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  
  // Banner states
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  const handleShowLoading = () => {
    setShowLoading(true);
    setTimeout(() => setShowLoading(false), 3000);
  };

  const triggerToast = (type: "success" | "error" | "warning" | "info") => {
    const messages = {
      success: { title: "Sucesso!", description: "Operação realizada com sucesso." },
      error: { title: "Erro!", description: "Algo deu errado. Tente novamente." },
      warning: { title: "Atenção!", description: "Esta ação requer cuidado." },
      info: { title: "Informação", description: "Esta é uma notificação informativa." },
    };
    
    toast[type](messages[type].title, { description: messages[type].description });
  };

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DebugOfflineBanner show={showOfflineBanner} onClose={() => setShowOfflineBanner(false)} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/admin")}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Debug Mode</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Modais Section */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
              <Layout className="h-5 w-5 text-gray-600" />
              Modais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setShowUpdateModal(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2 text-gray-500" />
              Atualização Disponível
            </Button>
            
            <div className="flex gap-2">
              <Select value={announcementType} onValueChange={(v) => setAnnouncementType(v as typeof announcementType)}>
                <SelectTrigger className="flex-1 border-gray-300 text-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowAnnouncementModal(true)}
              >
                Abrir Aviso
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setShowReturningUserModal(true)}
            >
              <UserCheck className="h-4 w-4 mr-2 text-gray-500" />
              Usuário Retornando
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setShowDemoLockedModal(true)}
            >
              <Lock className="h-4 w-4 mr-2 text-gray-500" />
              Recurso Bloqueado (Demo)
            </Button>
          </CardContent>
        </Card>

        {/* Telas Section */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
              <Smartphone className="h-5 w-5 text-gray-600" />
              Telas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setShowOnboarding(true)}
            >
              <Sparkles className="h-4 w-4 mr-2 text-gray-500" />
              Ver Onboarding
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={handleShowLoading}
            >
              <Loader2 className="h-4 w-4 mr-2 text-gray-500" />
              Ver Loading Screen (3s)
            </Button>
          </CardContent>
        </Card>

        {/* Banners e Toasts Section */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
              <Bell className="h-5 w-5 text-gray-600" />
              Banners e Toasts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setShowOfflineBanner(true)}
            >
              <WifiOff className="h-4 w-4 mr-2 text-gray-500" />
              Simular Offline
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => triggerToast("success")}
              >
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                Sucesso
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => triggerToast("error")}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Erro
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => triggerToast("warning")}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                Aviso
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => triggerToast("info")}
              >
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <DebugUpdateModal open={showUpdateModal} onOpenChange={setShowUpdateModal} />
      <DebugAnnouncementModal open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal} type={announcementType} />
      <DebugReturningUserModal open={showReturningUserModal} onOpenChange={setShowReturningUserModal} />
      <DemoLockedModal open={showDemoLockedModal} onOpenChange={setShowDemoLockedModal} />
    </div>
  );
}
