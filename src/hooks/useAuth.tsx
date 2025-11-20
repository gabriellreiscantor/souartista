import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRole, setUserRoleState] = useState<'artist' | 'musician' | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('[useAuth] Fetching user data for:', userId);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching user data')), 8000)
      );
      
      // Fetch profile data with timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
      if (profileError) {
        console.error('[useAuth] Error fetching profile:', profileError);
      } else if (profile) {
        console.log('[useAuth] Profile loaded:', profile);
        setUserData(profile);
      } else {
        console.warn('[useAuth] No profile found for user:', userId);
        setUserData(null);
      }

      // Fetch user role with timeout
      const rolePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data: roleData, error: roleError } = await Promise.race([
        rolePromise,
        timeoutPromise
      ]) as any;
      
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
    console.log('[useAuth] Initializing auth...');
    let isInitialLoad = true;
    
    // Check for existing session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useAuth] Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
      isInitialLoad = false;
    });
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.id);
        
        // Skip initial SIGNED_IN event to avoid duplicate fetch
        if (isInitialLoad && event === 'SIGNED_IN') {
          console.log('[useAuth] Skipping initial SIGNED_IN event');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setUserData(null);
          setUserRoleState(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: Partial<UserData>) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Send all user data in user_metadata - the database trigger will handle profile creation
    const { error } = await supabase.auth.signUp({
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
          is_verified: userData.is_verified || false,
        },
      },
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
