import { useEffect, useState, useRef } from 'react';
import { useNativePlatform } from './useNativePlatform';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppleProduct {
  identifier: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  planType: 'monthly' | 'annual';
}

const REVENUECAT_ERROR_CODES = {
  PURCHASE_CANCELLED: 'PURCHASE_CANCELLED',
  PRODUCT_ALREADY_PURCHASED: 'PRODUCT_ALREADY_PURCHASED',
  PURCHASE_NOT_ALLOWED: 'PURCHASE_NOT_ALLOWED',
  STORE_PROBLEM: 'STORE_PROBLEM',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
};

export const useAppleIAP = () => {
  const { isIOS, isNative } = useNativePlatform();
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
      
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      purchasesRef.current = Purchases;
      
      console.log('[useAppleIAP] Purchases module loaded:', typeof Purchases);
      console.log('[useAppleIAP] Purchases methods:', Purchases ? Object.keys(Purchases) : 'N/A');
      
      if (!Purchases) {
        console.error('[useAppleIAP] ❌ RevenueCat Purchases module not available');
        setIsInitialized(false);
        return;
      }

      console.log('[useAppleIAP] Setting log level to DEBUG...');
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

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
      const offerings = await Purchases.getOfferings();
      console.log('[useAppleIAP] Offerings received:', JSON.stringify(offerings, null, 2));
      
      if (!offerings.current) {
        console.warn('[useAppleIAP] ❌ No current offering available');
        return;
      }

      console.log('[useAppleIAP] Current offering:', offerings.current.identifier);
      console.log('[useAppleIAP] Available packages:', offerings.current.availablePackages?.length || 0);

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
      toast.error("Não foi possível carregar os produtos disponíveis.");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingEntitlements = async (Purchases: any): Promise<boolean> => {
    try {
      console.log('[useAppleIAP] Checking existing entitlements before purchase...');
      const { customerInfo } = await Purchases.getCustomerInfo();
      console.log('[useAppleIAP] Current customerInfo:', JSON.stringify(customerInfo, null, 2));
      
      const hasActiveSubscription = !!customerInfo.entitlements?.active?.['premium'];
      console.log('[useAppleIAP] Has active premium subscription:', hasActiveSubscription);
      
      if (hasActiveSubscription) {
        console.log('[useAppleIAP] Active entitlements:', Object.keys(customerInfo.entitlements?.active || {}));
        console.log('[useAppleIAP] Premium details:', customerInfo.entitlements?.active?.['premium']);
      }
      
      return hasActiveSubscription;
    } catch (error) {
      console.error('[useAppleIAP] Error checking entitlements:', error);
      return false;
    }
  };

  const purchaseProduct = async (planType: 'monthly' | 'annual') => {
    try {
      console.log('[useAppleIAP] ========== STARTING PURCHASE ==========');
      console.log('[useAppleIAP] Plan type:', planType);
      setLoading(true);
      
      const Purchases = purchasesRef.current;
      
      if (!isInitialized || !Purchases) {
        toast.error("In-App Purchase está disponível apenas no app iOS nativo.");
        return false;
      }

      const hasExistingSubscription = await checkExistingEntitlements(Purchases);
      if (hasExistingSubscription) {
        console.log('[useAppleIAP] ⚠️ User already has active subscription, calling restore instead...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { customerInfo } = await Purchases.getCustomerInfo();
          await supabase.functions.invoke('verify-apple-receipt', {
            body: { appUserId: customerInfo.originalAppUserId, restore: true }
          });
        }
        toast.success("Você já possui uma assinatura ativa. Dados sincronizados.");
        return true;
      }

      const product = products.find(p => p.planType === planType);
      if (!product) {
        toast.error("Não foi possível encontrar o plano selecionado.");
        return false;
      }

      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.find(
        (p: any) => p.product?.identifier === product.identifier
      );

      if (!pkg) {
        toast.error("Pacote não encontrado no RevenueCat.");
        return false;
      }

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

      if (customerInfo.entitlements?.active?.['premium']) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: { appUserId: customerInfo.originalAppUserId, restore: false }
        });

        if (error) throw error;
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('[useAppleIAP] ❌ Error purchasing product:', error);
      
      if (error.code === REVENUECAT_ERROR_CODES.PURCHASE_CANCELLED || error.code === 1) {
        toast("Compra cancelada");
        return false;
      }
      
      if (error.code === REVENUECAT_ERROR_CODES.PRODUCT_ALREADY_PURCHASED || 
          error.message?.includes('already') || 
          error.message?.includes('PRODUCT_ALREADY_PURCHASED')) {
        try {
          const restored = await restorePurchases();
          if (restored) return true;
        } catch (restoreError) {
          console.error('[useAppleIAP] Restore after already-purchased failed:', restoreError);
        }
        toast("Você já possui este produto. Tentamos restaurar sua compra.");
        return false;
      }
      
      if (error.code === REVENUECAT_ERROR_CODES.PURCHASE_NOT_ALLOWED) {
        toast.error("Verifique suas configurações da App Store.");
        return false;
      }
      
      if (error.code === REVENUECAT_ERROR_CODES.STORE_PROBLEM) {
        toast.error("Problema ao conectar com a App Store. Tente novamente.");
        return false;
      }
      
      if (error.code === REVENUECAT_ERROR_CODES.NETWORK_ERROR) {
        toast.error("Verifique sua conexão com a internet.");
        return false;
      }
      
      const errorMessage = error?.underlyingErrorMessage || error?.message || "Não foi possível concluir a compra.";
      toast.error(errorMessage);
      
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
        toast.error("In-App Purchase está disponível apenas no app iOS nativo.");
        return false;
      }

      const { customerInfo } = await Purchases.restorePurchases();

      if (customerInfo.entitlements?.active?.['premium']) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: { appUserId: customerInfo.originalAppUserId, restore: true }
        });

        if (error) throw error;

        toast.success("Compras restauradas com sucesso!");
        return true;
      } else {
        toast("Não há assinaturas ativas para restaurar nesta conta.");
        return false;
      }
    } catch (error: any) {
      console.error('[useAppleIAP] ❌ Error restoring purchases:', error);
      toast.error(error?.message || "Não foi possível restaurar as compras. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async (): Promise<boolean> => {
    try {
      console.log('[useAppleIAP] ========== CHECKING SUBSCRIPTION STATUS ==========');
      
      const maxWaitTime = 5000;
      const pollInterval = 500;
      let waited = 0;
      
      while (!purchasesRef.current && waited < maxWaitTime) {
        console.log(`[useAppleIAP] Waiting for initialization... (${waited}ms)`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        waited += pollInterval;
      }
      
      const Purchases = purchasesRef.current;
      
      if (!Purchases) {
        console.log('[useAppleIAP] Purchases not available after 5s wait, skipping check');
        return false;
      }
      
      const { customerInfo } = await Purchases.getCustomerInfo();

      if (customerInfo.entitlements?.active?.['premium']) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: { appUserId: customerInfo.originalAppUserId, restore: true }
        });

        if (error) return false;
        return true;
      }

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
