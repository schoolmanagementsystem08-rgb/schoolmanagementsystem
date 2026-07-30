import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from './supabase-client.ts';
import api, { setAuthToken } from './api.ts';
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
    setAuthToken(session.access_token);
    try {
      const url = `${api.defaults.baseURL}/auth/me`;
      console.log('[Auth] Fetching profile from', url);
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      console.log('[Auth] Profile response:', res.status, res.data);
      const u = res.data?.user;
      if (!u) {
        console.warn('[Auth] Profile: user data missing');
        setProfile(null); setRole(''); setTeacher(null);
        return;
      }
      setProfile(u);
      setRole(u.role || '');
      setTeacher(res.data?.teacher || null);
      localStorage.setItem('role', u.role || '');
      localStorage.setItem('userName', u.name || '');
    } catch (err: any) {
      console.error('[Auth] Failed to fetch profile:', err?.response?.status, err?.response?.data || err.message);
      console.error('[Auth] Request URL:', `${api.defaults.baseURL}/auth/me`);
      setProfile(null);
      setRole('');
      setTeacher(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session) setAuthToken(session.access_token);
      if (session?.user) {
        const url = `${api.defaults.baseURL}/auth/me`;
        console.log('[Auth] Init profile fetch from', url);
        api.get('/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).then(res => {
          console.log('[Auth] Init profile response:', res.status);
          const u = res.data?.user;
          if (!u) {
            console.warn('[Auth] Init profile: user data missing in response');
            setProfile(null); setRole(''); setTeacher(null);
            return;
          }
          setProfile(u);
          setRole(u.role || '');
          setTeacher(res.data?.teacher || null);
          localStorage.setItem('role', u.role || '');
          localStorage.setItem('userName', u.name || '');
        }).catch((err: any) => {
          console.error('[Auth] Init profile failed:', err?.response?.status, err?.response?.data || err.message);
          console.error('[Auth] Init request URL:', url);
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
      if (session) setAuthToken(session.access_token);
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
    console.log('[Auth] Signing in with', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Auth] Sign in failed:', error.message);
      return { error: error.message };
    }
    console.log('[Auth] Sign in successful, fetching profile');
    await refreshProfile();
    return {};
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    console.log('[Auth] Signing up', email, 'as', role);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) {
      console.error('[Auth] Sign up failed:', error.message);
      return { error: error.message };
    }

    if (data.user) {
      console.log('[Auth] Sign up successful, user id:', data.user.id);
      const session = (await supabase.auth.getSession()).data.session;
      if (session) {
        const profileUrl = `${api.defaults.baseURL}/auth/profile`;
        console.log('[Auth] Creating profile at', profileUrl);
        try {
          await api.post('/auth/profile', { name }, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          console.log('[Auth] Profile created');
        } catch (err: any) {
          console.error('[Auth] Profile creation failed:', err?.response?.status, err?.response?.data || err.message);
        }
        await refreshProfile();
      } else {
        console.log('[Auth] No session after signup (email confirmation may be required)');
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
