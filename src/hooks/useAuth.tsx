import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  birth_date?: string;
  photo_url?: string;
  status_plano?: string;
  plan_type?: 'monthly' | 'annual' | null;
  plan_purchased_at?: string;
  is_verified?: boolean;
}

interface UserRole {
  role: 'artist' | 'musician';
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  userRole: 'artist' | 'musician' | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: Partial<UserData>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  setUserRole: (role: 'artist' | 'musician') => Promise<{ error: any }>;
  refetchUserData: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
  resendOtp: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRole, setUserRoleState] = useState<'artist' | 'musician' | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('[useAuth] Fetching user data for:', userId);
      setLoading(true); // Always set loading when starting to fetch
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching user data')), 8000)
      );
      
      // Fetch profile and role data in parallel
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      const rolePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      // Execute both queries in parallel with timeout
      const [profileResult, roleResult] = await Promise.race([
        Promise.all([profilePromise, rolePromise]),
        timeoutPromise.then(() => { throw new Error('Timeout'); })
      ]) as any;
      
      const { data: profile, error: profileError } = profileResult;
      const { data: roleData, error: roleError } = roleResult;
      
      if (profileError) {
        console.error('[useAuth] Error fetching profile:', profileError);
      } else if (profile) {
        console.log('[useAuth] Profile loaded:', profile);
        setUserData(profile);
      } else {
        console.warn('[useAuth] No profile found for user:', userId);
        setUserData(null);
      }

      // Check for expired canceled subscriptions and update status_plano if needed (non-blocking)
      if (profile) {
        (async () => {
          try {
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (subscription && subscription.status === 'canceled' && subscription.next_due_date) {
              const today = new Date();
              const dueDate = new Date(subscription.next_due_date);
              
              if (today > dueDate && profile?.status_plano === 'ativo') {
                console.log('[useAuth] Subscription expired, updating status_plano to inactive');
                await supabase
                  .from('profiles')
                  .update({ status_plano: 'inactive' })
                  .eq('id', userId);
                
                const { data: updatedProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .maybeSingle();
                
                if (updatedProfile) {
                  setUserData(updatedProfile as UserData);
                }
              }
            }
          } catch (error) {
            console.error('[useAuth] Error checking subscription expiration:', error);
          }
        })();
      }
      
      if (roleError) {
        console.error('[useAuth] Error fetching role:', roleError);
      } else if (roleData) {
        console.log('[useAuth] Role loaded:', roleData.role);
        setUserRoleState(roleData.role);
      } else {
        console.log('[useAuth] No role found for user:', userId);
        setUserRoleState(null);
      }
    } catch (error) {
      console.error('[useAuth] Error in fetchUserData:', error);
      // Even on error, set loading to false so user isn't stuck
      setUserData(null);
      setUserRoleState(null);
    } finally {
      console.log('[useAuth] Finished fetching user data, setting loading to false');
      setLoading(false);
    }
  };

  const refetchUserData = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    console.log('[useAuth] ====== AUTH INIT START ======');
    console.log('[useAuth] isLoggingOutRef.current:', isLoggingOutRef.current);
    
    // Check localStorage at init time
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        authKeys.push(key);
      }
    }
    console.log('[useAuth] Auth-related localStorage keys at init:', authKeys);
    
    let isInitialLoad = true;
    let mounted = true;
    
    // Check for existing session first
    console.log('[useAuth] Calling getSession()...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      console.log('[useAuth] getSession() returned:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error?.message
      });
      if (error) {
        console.error('[useAuth] Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('[useAuth] Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        console.warn('[useAuth] No active session found');
        setLoading(false);
      }
      isInitialLoad = false;
    }).catch((err) => {
      console.error('[useAuth] Exception getting session:', err);
      if (mounted) {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // CRITICAL: Ignore ALL auth events during logout to prevent session restoration
        if (isLoggingOutRef.current) {
          console.log('[useAuth] Ignoring auth event during logout:', event);
          return;
        }
        
        console.log('[useAuth] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only fetch if not the initial load (which already fetched)
          if (!isInitialLoad) {
            fetchUserData(session.user.id);
          }
        } else {
          setUserData(null);
          setUserRoleState(null);
          setLoading(false);
        }
        
        isInitialLoad = false;
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: Partial<UserData>) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Send all user data in user_metadata - the database trigger will handle profile creation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: userData.name || '',
            cpf: userData.cpf,
            phone: userData.phone,
            birth_date: userData.birth_date,
            photo_url: userData.photo_url,
            status_plano: userData.status_plano || 'inactive',
            is_verified: false,
          },
        },
      });

      if (error) return { error };

      console.log('Conta criada com sucesso. Enviando código OTP...');

      // Enviar código OTP via nossa edge function customizada
      const { error: otpError } = await supabase.functions.invoke('send-otp-email', {
        body: { email }
      });

      if (otpError) {
        console.error('Erro ao enviar código OTP:', otpError);
        return { error: otpError };
      }

      console.log('Código OTP enviado com sucesso');
      return { error: null };
    } catch (error: any) {
      console.error('Erro no signup:', error);
      return { error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      console.log('Verificando código OTP...');
      
      // Chamar nossa edge function customizada para verificar o código
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, code: token }
      });

      if (error) {
        console.error('Erro ao verificar OTP:', error);
        return { error };
      }

      if (data?.error) {
        console.error('Erro na resposta:', data.error);
        return { error: new Error(data.error) };
      }

      console.log('Código OTP verificado com sucesso');
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao verificar OTP:', error);
      return { error };
    }
  };

  const resendOtp = async (email: string) => {
    try {
      console.log('Reenviando código OTP...');
      
      // Chamar nossa edge function para gerar e enviar novo código
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { email }
      });

      if (error) {
        console.error('Erro ao reenviar OTP:', error);
        return { error };
      }

      console.log('Novo código OTP enviado com sucesso');
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao reenviar OTP:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('[useAuth] ====== LOGOUT START ======');
    console.log('[useAuth] Current user:', user?.email);
    console.log('[useAuth] Current session exists:', !!session);
    
    // CRITICAL: Set flag FIRST to block onAuthStateChange from restoring session
    isLoggingOutRef.current = true;
    console.log('[useAuth] isLoggingOutRef set to TRUE');
    
    // Clear states IMMEDIATELY
    setUser(null);
    setUserData(null);
    setUserRoleState(null);
    setSession(null);
    setLoading(false);
    console.log('[useAuth] All states cleared');
    
    // CLEAR localStorage FIRST - before signOut call
    console.log('[useAuth] Checking localStorage before clear...');
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      allKeys.push(localStorage.key(i));
    }
    console.log('[useAuth] All localStorage keys:', allKeys);
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    console.log('[useAuth] Keys to remove:', keysToRemove);
    keysToRemove.forEach(key => {
      console.log('[useAuth] Removing key:', key);
      localStorage.removeItem(key);
    });
    console.log('[useAuth] localStorage cleared');
    
    // Also try clearing the specific known key format
    const projectRef = 'wjutvzmnvemrplpwbkyf';
    const specificKey = `sb-${projectRef}-auth-token`;
    console.log('[useAuth] Trying to remove specific key:', specificKey);
    localStorage.removeItem(specificKey);
    
    // Clear sessionStorage as well
    console.log('[useAuth] Clearing sessionStorage...');
    sessionStorage.clear();
    
    // Try signOut with 'local' scope (doesn't require server session)
    console.log('[useAuth] Calling supabase.auth.signOut({ scope: "local" })...');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.log('[useAuth] SignOut returned error:', error);
      } else {
        console.log('[useAuth] SignOut completed successfully');
      }
    } catch (error) {
      console.log('[useAuth] SignOut threw exception:', error);
    }
    
    // Double check localStorage after signOut
    console.log('[useAuth] Checking localStorage AFTER signOut...');
    const afterKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      afterKeys.push(localStorage.key(i));
    }
    console.log('[useAuth] localStorage keys after signOut:', afterKeys);
    
    // If any auth keys still exist, remove them again
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        console.log('[useAuth] STILL FOUND KEY - removing:', key);
        localStorage.removeItem(key);
      }
    }
    
    console.log('[useAuth] ====== REDIRECTING TO /login ======');
    // FORCE hard page reload to clear ALL memory state
    window.location.href = '/login';
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (!error && userData) {
      setUserData({ ...userData, ...data });
    }
  };

  const setUserRole = async (role: 'artist' | 'musician') => {
    try {
      if (!user?.id) {
        console.error('[useAuth] No user ID when setting role');
        return { error: new Error('Usuário não autenticado') };
      }
      
      console.log('[useAuth] Setting role:', role, 'for user:', user.id);
      
      // First check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      let error = null;
      
      if (existingRole) {
        // Update existing role
        console.log('[useAuth] Updating existing role');
        const result = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new role
        console.log('[useAuth] Inserting new role');
        const result = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: role,
          });
        error = result.error;
      }
      
      if (error) {
        console.error('[useAuth] Error setting role:', error);
        return { error };
      }
      
      console.log('[useAuth] Role saved successfully, refetching data...');
      setUserRoleState(role);
      
      // Force refetch after a small delay to ensure DB is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetchUserData();
      
      return { error: null };
    } catch (error) {
      console.error('[useAuth] Unexpected error setting role:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        userRole,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateUserData,
        setUserRole,
        refetchUserData,
        verifyOtp,
        resendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
