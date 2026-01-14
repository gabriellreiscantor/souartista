import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminTOTPSetup } from './AdminTOTPSetup';
import { AdminTOTPVerification } from './AdminTOTPVerification';

interface AdminTOTPGateProps {
  children: React.ReactNode;
}

type TOTPState = 'loading' | 'needs_setup' | 'needs_verification' | 'verified';

export function AdminTOTPGate({ children }: AdminTOTPGateProps) {
  const [state, setState] = useState<TOTPState>('loading');

  useEffect(() => {
    checkTOTPStatus();
  }, []);

  const checkTOTPStatus = async () => {
    // First check if already verified in this session
    if (sessionStorage.getItem('admin_totp_verified') === 'true') {
      setState('verified');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState('needs_setup');
        return;
      }

      const response = await supabase.functions.invoke('admin-totp-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Error checking TOTP status:', response.error);
        setState('needs_setup');
        return;
      }

      if (response.data.has_totp && response.data.is_verified) {
        setState('needs_verification');
      } else {
        setState('needs_setup');
      }
    } catch (error) {
      console.error('Error checking TOTP status:', error);
      setState('needs_setup');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'needs_setup') {
    return (
      <AdminTOTPSetup 
        onSetupComplete={() => setState('verified')} 
      />
    );
  }

  if (state === 'needs_verification') {
    return (
      <AdminTOTPVerification 
        onVerified={() => setState('verified')}
        onNeedsSetup={() => setState('needs_setup')}
      />
    );
  }

  return <>{children}</>;
}
