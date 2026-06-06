import { Suspense, Component, ReactNode, ErrorInfo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '../providers/AppProvider';
import { ConfirmProvider } from '../providers/ConfirmProvider';
import InstallPrompt from '../components/pwa/InstallPrompt';
import { router } from '../routes';

// ── Error Boundary global : évite la page blanche totale ──────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[REX] Erreur critique:', error, info);
  }

  handleReload = () => {
    // Vider les caches SW et recharger
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        Promise.all(regs.map(r => r.unregister())).then(() => {
          window.location.reload();
        });
      }).catch(() => window.location.reload());
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #065f46, #0ea57a)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'white',
            color: '#065f46',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              Mise à jour disponible
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Une nouvelle version de l'application est disponible.
              Cliquez sur le bouton ci-dessous pour recharger.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #065f46, #0ea57a)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              🔄 Recharger l'application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ConfirmProvider>
          <Suspense fallback={
            <div style={{
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #065f46, #0ea57a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
            }}>
              Chargement...
            </div>
          }>
            <RouterProvider router={router} />
          </Suspense>
          <InstallPrompt />
        </ConfirmProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
