import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ public_settings: {} });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser) => {
    try {
      let { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // If no users row exists (PGRST116 = no rows), auto-create one
      if (error && error.code === 'PGRST116') {
        console.log('No user profile found, auto-creating for', authUser.email);
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || '',
          role: 'staff',
        };
        const { data: created, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();
        if (createError) {
          console.error('Error auto-creating user profile:', createError);
        } else {
          profile = created;
        }
      } else if (error) {
        console.error('Error loading user profile:', error);
      }

      const userData = {
        id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        role: profile?.role || 'staff',
        page_permissions: profile?.page_permissions || {},
        avatar_url: profile?.avatar_url || '',
        phone: profile?.phone || '',
        ...profile,
      };

      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      // Still set as authenticated with basic info
      setUser({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || '',
        role: 'staff',
        page_permissions: {},
      });
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  };

  const login = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError({ type: 'auth_failed', message: error.message });
      throw error;
    }
    return data;
  };

  const signup = async (email, password, metadata = {}) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) {
      setAuthError({ type: 'signup_failed', message: error.message });
      throw error;
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    // Clear any stored session and reload
    window.location.hash = '#/login';
  };

  const updateProfile = async (updates) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setUser(prev => ({ ...prev, ...data }));
    return data;
  };

  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      signup,
      logout,
      navigateToLogin,
      updateProfile,
      changePassword,
      checkAppState: () => {}, // no-op for compatibility
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
