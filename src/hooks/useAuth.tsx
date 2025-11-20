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
    // Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profile) {
      setUserData(profile);
    }

    // Fetch user role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (roleData) {
      setUserRoleState(roleData.role);
    }
  };

  const refetchUserData = async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserData(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setLoading(false);
    });

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
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role })
      .select()
      .single();

    if (!error) {
      setUserRoleState(role);
    }

    return { error };
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
