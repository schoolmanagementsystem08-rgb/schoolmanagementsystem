import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from './supabase-client.ts';
import api from './api.ts';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  user: User | null;
  profile: any;
  teacher: any;
  role: string;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error?: string; needsEmailConfirm?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthUser>({} as AuthUser);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setToken(session.access_token);
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setProfile(res.data.user);
      setRole(res.data.user.role);
      setTeacher(res.data.teacher || null);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('userName', res.data.user.name);
    } catch {
      setProfile(null);
      setRole('');
      setTeacher(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session?.user) {
        api.get('/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).then(res => {
          setProfile(res.data.user);
          setRole(res.data.user.role);
          setTeacher(res.data.teacher || null);
          localStorage.setItem('role', res.data.user.role);
          localStorage.setItem('userName', res.data.user.name);
        }).catch(() => {
          setProfile(null);
          setRole('');
          setTeacher(null);
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (!session) {
        setProfile(null);
        setRole('');
        setTeacher(null);
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await refreshProfile();
    return {};
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) return { error: error.message };

    if (data.user) {
      const session = (await supabase.auth.getSession()).data.session;
      if (session) {
        await api.post('/auth/profile', { name }, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        await refreshProfile();
      }
    }

    return { needsEmailConfirm: !data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, teacher, role, loading, token, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
