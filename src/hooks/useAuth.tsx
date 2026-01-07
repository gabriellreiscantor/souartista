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
  gender?: 'male' | 'female' | null;
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
      setLoading(true);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching user data')), 8000)
      );
      
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
      
      const [profileResult, roleResult] = await Promise.race([
        Promise.all([profilePromise, rolePromise]),
        timeoutPromise.then(() => { throw new Error('Timeout'); })
      ]) as any;
      
      const { data: profile, error: profileError } = profileResult;
      const { data: roleData, error: roleError } = roleResult;
      
      if (profileError) {
        console.error('[useAuth] Error fetching profile:', profileError);
      } else if (profile) {
        setUserData(profile);
      } else {
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
        setUserRoleState(roleData.role);
      } else {
        setUserRoleState(null);
      }
    } catch (error) {
      console.error('[useAuth] Error in fetchUserData:', error);
      setUserData(null);
      setUserRoleState(null);
    } finally {
      setLoading(false);
    }
  };

  const refetchUserData = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    let isInitialLoad = true;
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('[useAuth] Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Ignore ALL auth events during logout to prevent session restoration
        if (isLoggingOutRef.current) {
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
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
            gender: userData.gender,
          },
        },
      });

      if (error) return { error };

      const { error: otpError } = await supabase.functions.invoke('send-otp-email', {
        body: { email }
      });

      if (otpError) {
        console.error('[useAuth] Error sending OTP:', otpError);
        return { error: otpError };
      }

      return { error: null };
    } catch (error: any) {
      console.error('[useAuth] Error in signup:', error);
      return { error };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, code: token }
      });

      if (error) {
        console.error('[useAuth] Error verifying OTP:', error);
        return { error };
      }

      if (data?.error) {
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (error: any) {
      console.error('[useAuth] Error verifying OTP:', error);
      return { error };
    }
  };

  const resendOtp = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: { email }
      });

      if (error) {
        console.error('[useAuth] Error resending OTP:', error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('[useAuth] Error resending OTP:', error);
      return { error };
    }
  };

  const signOut = async () => {
    // Set flag to block onAuthStateChange from restoring session
    isLoggingOutRef.current = true;
    
    // Clear states immediately
    setUser(null);
    setUserData(null);
    setUserRoleState(null);
    setSession(null);
    setLoading(false);
    
    // Clear localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear specific known key format
    const projectRef = 'wjutvzmnvemrplpwbkyf';
    localStorage.removeItem(`sb-${projectRef}-auth-token`);
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear IndexedDB (Supabase may use this in iframes)
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && (db.name.includes('supabase') || db.name.includes('auth') || db.name.includes('sb-'))) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      } catch (e) {
        // IndexedDB cleanup not supported in this browser
      }
    }
    
    // Clear auth-related cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.includes('sb-') || name.includes('supabase') || name.includes('auth')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });
    
    // SignOut with local scope
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      // Ignore signOut errors
    }
    
    // Final cleanup - remove any remaining auth keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Force hard page reload to clear all memory state
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
      
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      let error = null;
      
      if (existingRole) {
        const result = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', user.id);
        error = result.error;
      } else {
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
      
      setUserRoleState(role);
      
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
