import { useEffect, useState, useRef } from 'react';
import { useNativePlatform } from './useNativePlatform';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface AppleProduct {
  identifier: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  planType: 'monthly' | 'annual';
}

export const useAppleIAP = () => {
  const { isIOS, isNative } = useNativePlatform();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState<AppleProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const purchasesRef = useRef<any>(null);

  useEffect(() => {
    if (isIOS && isNative) {
      initializeIAP();
    }
  }, [isIOS, isNative]);

  const initializeIAP = async () => {
    try {
      console.log('[useAppleIAP] ========== INITIALIZING IAP ==========');
      console.log('[useAppleIAP] isIOS:', isIOS);
      console.log('[useAppleIAP] isNative:', isNative);
      console.log('[useAppleIAP] User Agent:', navigator.userAgent);
      
      // Dynamic import to avoid breaking web builds
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      purchasesRef.current = Purchases;
      
      console.log('[useAppleIAP] Purchases module loaded:', typeof Purchases);
      console.log('[useAppleIAP] Purchases methods:', Purchases ? Object.keys(Purchases) : 'N/A');
      
      if (!Purchases) {
        console.error('[useAppleIAP] ❌ RevenueCat Purchases module not available');
        setIsInitialized(false);
        return;
      }

      // Set log level for debugging
      console.log('[useAppleIAP] Setting log level to DEBUG...');
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      // RevenueCat Public API Key (iOS)
      const apiKey = 'appl_KQGhvKDWBIoyOHAGhieWergOjig';
      console.log('[useAppleIAP] Configuring with API Key:', apiKey.substring(0, 15) + '...');

      await Purchases.configure({ apiKey });
      console.log('[useAppleIAP] ✅ RevenueCat configured successfully!');
      
      setIsInitialized(true);
      await loadProductsInternal(Purchases);
    } catch (error: any) {
      console.error('[useAppleIAP] ❌ Error initializing IAP:', error);
      console.error('[useAppleIAP] Error name:', error?.name);
      console.error('[useAppleIAP] Error message:', error?.message);
      console.error('[useAppleIAP] Error stack:', error?.stack);
      setIsInitialized(false);
    }
  };

  const loadProductsInternal = async (Purchases: any) => {
    setLoading(true);
    try {
      console.log('[useAppleIAP] Loading products from RevenueCat...');

      // Buscar ofertas do RevenueCat
      const offerings = await Purchases.getOfferings();
      console.log('[useAppleIAP] Offerings received:', JSON.stringify(offerings, null, 2));
      
      if (!offerings.current) {
        console.warn('[useAppleIAP] ❌ No current offering available');
        return;
      }

      console.log('[useAppleIAP] Current offering:', offerings.current.identifier);
      console.log('[useAppleIAP] Available packages:', offerings.current.availablePackages?.length || 0);

      // Converter os pacotes do RevenueCat para o formato do app
      const rcProducts: AppleProduct[] = (offerings.current.availablePackages || []).map((pkg: any) => {
        const isAnnual = pkg.identifier?.includes('annual') || pkg.packageType === 'ANNUAL';
        console.log('[useAppleIAP] Package:', pkg.identifier, 'Type:', pkg.packageType, 'isAnnual:', isAnnual);
        return {
          identifier: pkg.product?.identifier || pkg.identifier,
          title: pkg.product?.title || 'SouArtista',
          description: pkg.product?.description || '',
          price: pkg.product?.price || 0,
          priceString: pkg.product?.priceString || '',
          planType: isAnnual ? 'annual' : 'monthly'
        };
      });
      
      console.log('[useAppleIAP] ✅ Products loaded:', rcProducts.length);
      console.log('[useAppleIAP] Products:', JSON.stringify(rcProducts, null, 2));
      setProducts(rcProducts);
    } catch (error: any) {
      console.error('[useAppleIAP] ❌ Error loading products:', error);
      console.error('[useAppleIAP] Error message:', error?.message);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar os produtos disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const purchaseProduct = async (planType: 'monthly' | 'annual') => {
    try {
      console.log('[useAppleIAP] ========== STARTING PURCHASE ==========');
      console.log('[useAppleIAP] Plan type:', planType);
      console.log('[useAppleIAP] isInitialized:', isInitialized);
      console.log('[useAppleIAP] Available products:', products.length);
      setLoading(true);
      
      const Purchases = purchasesRef.current;
      
      if (!isInitialized || !Purchases) {
        console.error('[useAppleIAP] ❌ IAP not initialized');
        toast({
          title: "IAP não disponível",
          description: "In-App Purchase está disponível apenas no app iOS nativo.",
          variant: "destructive",
        });
        return false;
      }

      // Encontrar o produto correspondente
      const product = products.find(p => p.planType === planType);
      console.log('[useAppleIAP] Found product:', product);
      
      if (!product) {
        toast({
          title: "Produto não encontrado",
          description: "Não foi possível encontrar o plano selecionado.",
          variant: "destructive",
        });
        return false;
      }

      // Buscar o pacote do RevenueCat
      console.log('[useAppleIAP] Fetching offerings for purchase...');
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.find(
        (p: any) => p.product?.identifier === product.identifier
      );

      console.log('[useAppleIAP] Package for purchase:', pkg);

      if (!pkg) {
        toast({
          title: "Erro ao processar",
          description: "Pacote não encontrado no RevenueCat.",
          variant: "destructive",
        });
        return false;
      }

      // Realizar a compra
      console.log('[useAppleIAP] Calling purchasePackage...');
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      console.log('[useAppleIAP] Purchase result - customerInfo:', JSON.stringify(customerInfo, null, 2));

      // Verificar se a compra foi bem-sucedida
      if (customerInfo.entitlements?.active?.['premium']) {
        console.log('[useAppleIAP] ✅ Premium entitlement active!');
        
        // Chamar a edge function para validar e atualizar o banco
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        console.log('[useAppleIAP] Calling verify-apple-receipt edge function...');
        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: {
            appUserId: customerInfo.originalAppUserId,
            restore: false
          }
        });

        if (error) {
          console.error('[useAppleIAP] ❌ Edge function error:', error);
          throw error;
        }

        console.log('[useAppleIAP] ✅ Purchase verified and saved!');
        toast({
          title: "Compra realizada!",
          description: "Sua assinatura foi ativada com sucesso.",
        });

        return true;
      }

      console.warn('[useAppleIAP] ⚠️ No premium entitlement after purchase');
      return false;
    } catch (error: any) {
      console.error('[useAppleIAP] ❌ Error purchasing product:', error);
      console.error('[useAppleIAP] Error code:', error?.code);
      console.error('[useAppleIAP] Error message:', error?.message);
      
      // Tratar cancelamento pelo usuário
      if (error.code === 'PURCHASE_CANCELLED' || error.code === 1) {
        toast({
          title: "Compra cancelada",
          description: "Você cancelou a compra.",
        });
        return false;
      }
      
      toast({
        title: "Erro na compra",
        description: error?.message || "Não foi possível concluir a compra. Tente novamente.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      console.log('[useAppleIAP] ========== RESTORING PURCHASES ==========');
      setLoading(true);
      
      const Purchases = purchasesRef.current;
      
      if (!isInitialized || !Purchases) {
        toast({
          title: "IAP não disponível",
          description: "In-App Purchase está disponível apenas no app iOS nativo.",
          variant: "destructive",
        });
        return false;
      }

      // Restaurar compras via RevenueCat
      console.log('[useAppleIAP] Calling restorePurchases...');
      const { customerInfo } = await Purchases.restorePurchases();
      console.log('[useAppleIAP] Restore result:', JSON.stringify(customerInfo, null, 2));

      // Verificar se tem assinatura ativa
      if (customerInfo.entitlements?.active?.['premium']) {
        console.log('[useAppleIAP] ✅ Premium entitlement found!');
        
        // Chamar edge function para sincronizar com o banco
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: {
            appUserId: customerInfo.originalAppUserId,
            restore: true
          }
        });

        if (error) {
          console.error('[useAppleIAP] ❌ Edge function error:', error);
          throw error;
        }

        toast({
          title: "Compras restauradas!",
          description: "Sua assinatura foi restaurada com sucesso.",
        });

        return true;
      } else {
        console.warn('[useAppleIAP] ⚠️ No premium entitlement found');
        toast({
          title: "Nenhuma compra encontrada",
          description: "Não há assinaturas para restaurar.",
        });
        return false;
      }
    } catch (error: any) {
      console.error('[useAppleIAP] ❌ Error restoring purchases:', error);
      console.error('[useAppleIAP] Error message:', error?.message);
      toast({
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar as compras. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verificação silenciosa de assinatura (sem toasts, para uso automático no login)
  const checkSubscriptionStatus = async (): Promise<boolean> => {
    try {
      console.log('[useAppleIAP] ========== CHECKING SUBSCRIPTION STATUS ==========');
      
      // Aguardar inicialização se necessário
      if (!isInitialized) {
        console.log('[useAppleIAP] Waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const Purchases = purchasesRef.current;
      
      if (!Purchases) {
        console.log('[useAppleIAP] Purchases not available, skipping check');
        return false;
      }

      // Buscar customer info do RevenueCat
      console.log('[useAppleIAP] Getting customer info...');
      const { customerInfo } = await Purchases.getCustomerInfo();
      console.log('[useAppleIAP] Customer info:', JSON.stringify(customerInfo, null, 2));

      // Verificar se tem assinatura ativa
      if (customerInfo.entitlements?.active?.['premium']) {
        console.log('[useAppleIAP] ✅ Active premium subscription found!');
        
        // Chamar edge function para sincronizar com o banco
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[useAppleIAP] No authenticated user');
          return false;
        }

        console.log('[useAppleIAP] Syncing subscription to database...');
        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: {
            appUserId: customerInfo.originalAppUserId,
            restore: true
          }
        });

        if (error) {
          console.error('[useAppleIAP] ❌ Edge function error:', error);
          return false;
        }

        console.log('[useAppleIAP] ✅ Subscription synced to database!');
        return true;
      }

      console.log('[useAppleIAP] No active premium subscription');
      return false;
    } catch (error: any) {
      console.error('[useAppleIAP] ❌ Error checking subscription status:', error);
      return false;
    }
  };

  return {
    isInitialized,
    products,
    loading,
    purchaseProduct,
    restorePurchases,
    checkSubscriptionStatus,
  };
};
