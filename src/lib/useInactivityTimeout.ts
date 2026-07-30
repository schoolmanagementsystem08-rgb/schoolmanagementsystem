import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

const INACTIVITY_MS = 15 * 60 * 1000;

export function useInactivityTimeout() {
  const { signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => signOut(), INACTIVITY_MS);
    };

    reset();
    events.forEach(e => window.addEventListener(e, reset));
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
