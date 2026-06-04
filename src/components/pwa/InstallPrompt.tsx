import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari =
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  useEffect(() => {
    if (isStandalone) return;
    if (dismissed) return;

    // Android / Chrome / Edge: beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwa_prompt_dismissed')) {
        setShowAndroid(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari: show manual guide
    if (isIOS && isSafari && !localStorage.getItem('pwa_prompt_dismissed')) {
      setShowIOS(true);
    }

    window.addEventListener('appinstalled', () => {
      setShowAndroid(false);
      setShowIOS(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('PWA installée');
    }
    setDeferredPrompt(null);
    setShowAndroid(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', '1');
    setDismissed(true);
    setShowAndroid(false);
    setShowIOS(false);
  };

  if (isStandalone || dismissed) return null;

  // ─── iOS Safari: Guide visuel ────────────────────────────────────────────────
  if (showIOS) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
        style={{ background: 'linear-gradient(135deg,#065f46,#0ea57a)' }}
      >
        {/* Flèche pointant vers la barre Safari */}
        <div className="flex justify-center">
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderBottom: '12px solid #065f46',
              marginBottom: 0,
            }}
          />
        </div>

        <div className="p-4 pb-8 text-white">
          <div className="flex items-start justify-between mb-3">
            <p className="font-bold text-base">Installer Production Rex</p>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition ml-2 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step 1 */}
          <div className="flex items-center gap-3 mb-3 bg-white/10 rounded-xl p-3">
            <div className="bg-white text-green-700 rounded-full w-7 h-7 flex items-center justify-center font-black text-sm flex-shrink-0">
              1
            </div>
            <div className="flex-1 text-sm">
              Appuyez sur l'icône{' '}
              <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-lg font-semibold">
                <Share className="h-4 w-4" />
                Partager
              </span>{' '}
              en bas de l'écran Safari
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
            <div className="bg-white text-green-700 rounded-full w-7 h-7 flex items-center justify-center font-black text-sm flex-shrink-0">
              2
            </div>
            <div className="flex-1 text-sm">
              Faites défiler et appuyez sur{' '}
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg">
                « Sur l'écran d'accueil »
              </span>
              , puis confirmez
            </div>
          </div>

          <p className="text-xs text-white/60 mt-3 text-center">
            ⚠️ Fonctionne uniquement dans Safari (pas Chrome/Firefox sur iOS)
          </p>
        </div>
      </div>
    );
  }

  // ─── Android / Desktop: Prompt natif ─────────────────────────────────────────
  if (!showAndroid) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
      style={{ background: 'linear-gradient(135deg,#065f46,#0ea57a)' }}
    >
      <div className="p-4 pb-8 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white text-green-700 rounded-xl p-2">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Installer Production Rex</p>
            <p className="text-xs text-white/70">Accès rapide, hors-ligne</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-green-800 px-5 py-2 rounded-full text-sm font-black shadow-md hover:bg-white/90 transition"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
