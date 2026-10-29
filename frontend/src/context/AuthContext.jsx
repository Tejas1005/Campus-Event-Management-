import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { tabStorage, tabId } from '../services/tabSession';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(tabStorage.getItem('cems_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any legacy shared localStorage keys
    localStorage.removeItem('cems_token');
    localStorage.removeItem('cems_user');
    localStorage.removeItem('cems_pending_role');

    const initializeAuth = async () => {
      // 1. If Supabase is configured, check tab-isolated Supabase session
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const pendingRole = tabStorage.getItem('cems_pending_role');
            const finalRole = pendingRole || session.user.user_metadata?.role || 'student';

            try {
              const exchangeRes = await authAPI.googleExchange(session.access_token, finalRole);
              const { access_token, user: backendUser } = exchangeRes.data;
              setUser(backendUser);
              setToken(access_token);
              tabStorage.setItem('cems_token', access_token);
              tabStorage.setItem('cems_user', JSON.stringify(backendUser));
              setLoading(false);
              return;
            } catch (exchangeErr) {
              console.warn('Backend token exchange error, using Supabase fallback:', exchangeErr);
              const sbUser = {
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                role: finalRole,
                department: session.user.user_metadata?.department || (finalRole === 'admin' ? 'University Administration' : finalRole === 'coordinator' ? 'Student Affairs' : 'Computer Science'),
                student_id: session.user.user_metadata?.student_id || null,
              };
              setUser(sbUser);
              setToken(session.access_token);
              tabStorage.setItem('cems_token', session.access_token);
              tabStorage.setItem('cems_user', JSON.stringify(sbUser));
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Failed to get Supabase session:', err);
        }
      }

      // 2. Tab-isolated session verification
      const storedToken = tabStorage.getItem('cems_token');
      const storedUser = tabStorage.getItem('cems_user');
      if (storedToken) {
        // Supabase tokens, role tokens, and mail-session tokens are not verifiable
        // by the local FastAPI backend — skip the API call to avoid a 401 redirect loop.
        const isNonBackendToken =
          storedToken.startsWith('sb_') ||
          storedToken.startsWith('cems_role_') ||
          storedToken.startsWith('cems_mail_session_') ||
          storedToken === 'supabase_token';

        if (isNonBackendToken) {
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (_) {
              setUser(null);
            }
          }
        } else {
          try {
            const res = await authAPI.getMe();
            setUser(res.data);
          } catch (err) {
            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch (_) {
                setUser(null);
              }
            } else {
              console.error('Failed to verify token:', err);
              tabStorage.removeItem('cems_token');
              tabStorage.removeItem('cems_user');
              setUser(null);
              setToken(null);
            }
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to Supabase auth state changes strictly for this tab
    let subscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const pendingRole = tabStorage.getItem('cems_pending_role');
          const finalRole = pendingRole || session.user.user_metadata?.role || 'student';

          try {
            const exchangeRes = await authAPI.googleExchange(session.access_token, finalRole);
            const { access_token, user: backendUser } = exchangeRes.data;
            setUser(backendUser);
            setToken(access_token);
            tabStorage.setItem('cems_token', access_token);
            tabStorage.setItem('cems_user', JSON.stringify(backendUser));
          } catch (exchangeErr) {
            const sbUser = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              role: finalRole,
              department: session.user.user_metadata?.department || (finalRole === 'admin' ? 'University Administration' : finalRole === 'coordinator' ? 'Student Affairs' : 'Computer Science'),
              student_id: session.user.user_metadata?.student_id || null,
            };
            setUser(sbUser);
            setToken(session.access_token);
            tabStorage.setItem('cems_token', session.access_token);
            tabStorage.setItem('cems_user', JSON.stringify(sbUser));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          tabStorage.removeItem('cems_token');
          tabStorage.removeItem('cems_user');
          tabStorage.removeItem('cems_pending_role');
        }
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials) => {
    const selectedRole = credentials.role || 'student';

    // If Supabase is configured, attempt Supabase authentication first
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (!error && data?.user) {
        const tokenVal = data.session?.access_token || 'supabase_token';
        try {
          if (data.session?.access_token) {
            const exchangeRes = await authAPI.googleExchange(data.session.access_token, selectedRole);
            const { access_token, user: backendUser } = exchangeRes.data;
            tabStorage.setItem('cems_token', access_token);
            tabStorage.setItem('cems_user', JSON.stringify(backendUser));
            setToken(access_token);
            setUser(backendUser);
            return backendUser;
          }
        } catch (_) {}

        const loggedUser = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          role: selectedRole,
          department: data.user.user_metadata?.department || (selectedRole === 'admin' ? 'University Administration' : selectedRole === 'coordinator' ? 'Student Affairs' : 'Computer Science'),
          student_id: data.user.user_metadata?.student_id || null,
        };
        tabStorage.setItem('cems_token', tokenVal);
        tabStorage.setItem('cems_user', JSON.stringify(loggedUser));
        setToken(tokenVal);
        setUser(loggedUser);
        return loggedUser;
      }

      // If Supabase sign in fails, try local backend or allow login with credentials & chosen role
      if (error) {
        try {
          const res = await authAPI.login(credentials);
          const { access_token, user: loggedUser } = res.data;
          tabStorage.setItem('cems_token', access_token);
          tabStorage.setItem('cems_user', JSON.stringify(loggedUser));
          setToken(access_token);
          setUser(loggedUser);
          return loggedUser;
        } catch (_) {
          const loggedUser = {
            id: `usr_${Date.now()}`,
            email: credentials.email,
            full_name: credentials.email.split('@')[0].replace('.', ' ').toUpperCase(),
            role: selectedRole,
            department: selectedRole === 'admin' ? 'University Administration' : selectedRole === 'coordinator' ? 'Student Affairs' : 'Computer Science',
            student_id: selectedRole === 'student' ? 'STU-2024' : null,
          };
          const tokenVal = `cems_mail_session_${tabId}_${Date.now()}`;
          tabStorage.setItem('cems_token', tokenVal);
          tabStorage.setItem('cems_user', JSON.stringify(loggedUser));
          setToken(tokenVal);
          setUser(loggedUser);
          return loggedUser;
        }
      }
    }

    // Default backend login
    const res = await authAPI.login(credentials);
    const { access_token, user: loggedUser } = res.data;
    tabStorage.setItem('cems_token', access_token);
    tabStorage.setItem('cems_user', JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (userData) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role || 'student',
            department: userData.department,
            student_id: userData.student_id_number || userData.student_id || null,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }

    const res = await authAPI.register(userData);
    return res.data;
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out from Supabase:', err);
      }
    }
    tabStorage.removeItem('cems_token');
    tabStorage.removeItem('cems_user');
    tabStorage.removeItem('cems_pending_role');
    setToken(null);
    setUser(null);
  };

  const loginWithGoogle = async (selectedRole = 'student') => {
    if (isSupabaseConfigured && supabase) {
      tabStorage.setItem('cems_pending_role', selectedRole);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    }
    throw new Error('Supabase is not configured yet.');
  };

  const sendMagicLink = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    }
    throw new Error('Supabase is not configured yet.');
  };

  const quickRoleLogin = async (role) => {
    // Map roles to real seeded demo credentials so the backend issues a real JWT
    const demoCredentials = {
      admin:       { email: 'admin@cems.edu',        password: 'Admin@123' },
      coordinator: { email: 'sarah.coord@cems.edu',  password: 'Coord@123' },
      student:     { email: 'alex.student@cems.edu', password: 'Student@123' },
    };

    const creds = demoCredentials[role];
    if (!creds) return;

    try {
      const res = await authAPI.login({ ...creds, role });
      const { access_token, user: loggedUser } = res.data;
      tabStorage.setItem('cems_token', access_token);
      tabStorage.setItem('cems_user', JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
      return loggedUser;
    } catch (_) {
      // Backend unavailable — fall back to a local preview token
      const roleUser = {
        admin:       { id: 'admin-001',   email: 'admin@cems.edu',        full_name: 'Campus Administrator', role: 'admin',       department: 'University Administration', student_id: null },
        coordinator: { id: 'coord-001',   email: 'sarah.coord@cems.edu',  full_name: 'Prof. Sarah Jenkins',  role: 'coordinator', department: 'Student Affairs & Events',  student_id: null },
        student:     { id: 'student-001', email: 'alex.student@cems.edu', full_name: 'Alex Rivera',          role: 'student',     department: 'Computer Science',          student_id: 'CS2024-042' },
      }[role];
      const roleToken = `cems_role_${role}_${tabId}_${Date.now()}`;
      tabStorage.setItem('cems_token', roleToken);
      tabStorage.setItem('cems_user', JSON.stringify(roleUser));
      setToken(roleToken);
      setUser(roleUser);
      return roleUser;
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    tabStorage.setItem('cems_user', JSON.stringify({ ...user, ...updatedData }));
  };

  const isStudent = user?.role === 'student';
  const isCoordinator = user?.role === 'coordinator';
  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        sendMagicLink,
        quickRoleLogin,
        register,
        logout,
        updateUser,
        isStudent,
        isCoordinator,
        isAdmin,
        isAuthenticated,
        isSupabaseConfigured,
        tabId,
      }}
    >
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
