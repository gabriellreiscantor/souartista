import { useEffect, useState } from 'react';
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

// Type definitions for RevenueCat Capacitor
interface PurchasesPlugin {
  configure: (options: { apiKey: string }) => Promise<void>;
  getOfferings: () => Promise<any>;
  purchasePackage: (options: { aPackage: any }) => Promise<{ customerInfo: any }>;
  restorePurchases: () => Promise<{ customerInfo: any }>;
}

export const useAppleIAP = () => {
  const { isIOS, isNative } = useNativePlatform();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [products, setProducts] = useState<AppleProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isIOS && isNative) {
      initializeIAP();
    }
  }, [isIOS, isNative]);

  const getPurchases = (): PurchasesPlugin | null => {
    try {
      // @ts-ignore - RevenueCat plugin is loaded at runtime in native iOS
      return window.Purchases || null;
    } catch {
      return null;
    }
  };

  const initializeIAP = async () => {
    try {
      console.log('[useAppleIAP] Initializing IAP...');
      console.log('[useAppleIAP] isIOS:', isIOS, 'isNative:', isNative);
      
      const Purchases = getPurchases();
      if (!Purchases) {
        console.warn('[useAppleIAP] RevenueCat plugin não disponível (apenas funciona em iOS nativo)');
        console.log('[useAppleIAP] window.Purchases:', typeof (window as any).Purchases);
        setIsInitialized(false);
        return;
      }

      console.log('[useAppleIAP] RevenueCat plugin found, configuring...');
      
      // RevenueCat Public API Key (iOS)
      // Esta é uma chave PÚBLICA, feita para estar no código do app
      const apiKey = 'appl_QMMKVysmKcFwBSTopyoULMZSrib';

      await Purchases.configure({ apiKey });
      console.log('[useAppleIAP] ✅ RevenueCat configured successfully');
      setIsInitialized(true);
      await loadProducts();
    } catch (error) {
      console.error('[useAppleIAP] ❌ Error initializing IAP:', error);
      setIsInitialized(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('[useAppleIAP] Loading products...');
      
      const Purchases = getPurchases();
      if (!Purchases || !isInitialized) {
        console.warn('[useAppleIAP] RevenueCat não está inicializado');
        return;
      }

      // Buscar ofertas do RevenueCat
      const offerings = await Purchases.getOfferings();
      console.log('[useAppleIAP] Offerings received:', JSON.stringify(offerings, null, 2));
      
      if (!offerings.current) {
        console.warn('[useAppleIAP] Nenhuma oferta disponível no RevenueCat');
        return;
      }

      console.log('[useAppleIAP] Current offering:', offerings.current.identifier);
      console.log('[useAppleIAP] Available packages:', offerings.current.availablePackages.length);

      // Converter os pacotes do RevenueCat para o formato do app
      const rcProducts: AppleProduct[] = offerings.current.availablePackages.map((pkg: any) => {
        const isAnnual = pkg.identifier.includes('annual') || pkg.packageType === 'ANNUAL';
        console.log('[useAppleIAP] Package:', pkg.identifier, 'Type:', pkg.packageType, 'isAnnual:', isAnnual);
        return {
          identifier: pkg.product.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
          planType: isAnnual ? 'annual' : 'monthly'
        };
      });
      
      console.log('[useAppleIAP] ✅ Products loaded:', rcProducts.length);
      setProducts(rcProducts);
    } catch (error) {
      console.error('[useAppleIAP] ❌ Error loading products:', error);
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
      console.log('[useAppleIAP] Starting purchase for:', planType);
      setLoading(true);
      
      const Purchases = getPurchases();
      if (!Purchases || !isInitialized) {
        console.log('[useAppleIAP] ❌ IAP not available - isInitialized:', isInitialized);
        toast({
          title: "IAP não disponível",
          description: "In-App Purchase está disponível apenas no app iOS nativo.",
          variant: "destructive",
        });
        return false;
      }

      // Encontrar o produto correspondente
      const product = products.find(p => p.planType === planType);
      if (!product) {
        toast({
          title: "Produto não encontrado",
          description: "Não foi possível encontrar o plano selecionado.",
          variant: "destructive",
        });
        return false;
      }

      // Buscar o pacote do RevenueCat
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p: any) => p.product.identifier === product.identifier
      );

      if (!pkg) {
        toast({
          title: "Erro ao processar",
          description: "Pacote não encontrado no RevenueCat.",
          variant: "destructive",
        });
        return false;
      }

      // Realizar a compra
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

      // Verificar se a compra foi bem-sucedida
      if (customerInfo.entitlements.active['premium']) {
        // Chamar a edge function para validar e atualizar o banco
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: {
            productId: product.identifier,
            transactionId: customerInfo.originalAppUserId,
            restore: false
          }
        });

        if (error) throw error;

        toast({
          title: "Compra realizada!",
          description: "Sua assinatura foi ativada com sucesso.",
        });

        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error purchasing product:', error);
      
      // Tratar cancelamento pelo usuário
      if (error.code === 'PURCHASE_CANCELLED') {
        toast({
          title: "Compra cancelada",
          description: "Você cancelou a compra.",
        });
        return false;
      }
      
      toast({
        title: "Erro na compra",
        description: "Não foi possível concluir a compra. Tente novamente.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setLoading(true);
      
      const Purchases = getPurchases();
      if (!Purchases || !isInitialized) {
        toast({
          title: "IAP não disponível",
          description: "In-App Purchase está disponível apenas no app iOS nativo.",
          variant: "destructive",
        });
        return false;
      }

      // Restaurar compras via RevenueCat
      const { customerInfo } = await Purchases.restorePurchases();

      // Verificar se tem assinatura ativa
      if (customerInfo.entitlements.active['premium']) {
        // Chamar edge function para sincronizar com o banco
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: {
            productId: customerInfo.entitlements.active['premium'].productIdentifier,
            transactionId: customerInfo.originalAppUserId,
            restore: true
          }
        });

        if (error) throw error;

        toast({
          title: "Compras restauradas!",
          description: "Sua assinatura foi restaurada com sucesso.",
        });

        return true;
      } else {
        toast({
          title: "Nenhuma compra encontrada",
          description: "Não há assinaturas para restaurar.",
        });
        return false;
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
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

  return {
    isInitialized,
    products,
    loading,
    purchaseProduct,
    restorePurchases,
  };
};
