import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: 'https://94ae8b6b309db73619d96dd0dec3495f@o4511807706431488.ingest.de.sentry.io/4511807726092368',
  environment: import.meta.env.VITE_SENTRY_ENV || (import.meta.env.DEV ? 'development' : 'production'),
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  dataCollection: {
    userInfo: true,
    httpBodies: import.meta.env.DEV,
  },
  beforeSend(event) {
    // Exclude known 404s and health checks
    if (event.request?.url?.includes('/api/health')) return null;
    return event;
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={({error, componentStack}) => (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-red-600">!</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-neutral-500 text-sm mb-4">An unexpected error occurred. The team has been notified.</p>
          {import.meta.env.DEV && (
            <pre className="text-left text-xs bg-red-50 p-4 rounded-xl mb-4 max-h-40 overflow-auto text-red-700">{error?.message}{componentStack}</pre>
          )}
          <button onClick={() => window.location.reload()} className="bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-neutral-800 transition-colors">
            Reload Page
          </button>
        </div>
      </div>
    )}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
