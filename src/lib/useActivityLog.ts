import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from './api';

function getPageName(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return segments.length ? segments[segments.length - 1] : 'dashboard';
}

export function logFrontend(action: string, entity?: string, entityId?: number, details?: any) {
  api.post('/logs/frontend', { action, entity, entityId, details, page: window.location.pathname }).catch(() => {});
}

export function logFrontendError(error: Error, level = 'error', details?: any) {
  api.post('/logs/frontend', {
    error: { message: error.message, stack: error.stack, level },
    details,
    page: window.location.pathname,
  }).catch(() => {});
}

export function usePageTracking() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      api.post('/logs/frontend', {
        action: 'page_view',
        entity: 'page',
        details: { page: location.pathname, pageName: getPageName(location.pathname) },
        page: location.pathname,
      }).catch(() => {});
    }
  }, [location.pathname]);
}
