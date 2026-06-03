import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

export function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setSupportsPWA(false);
    });

    return () => window.removeEventListener('transitionend', handler);
  }, []);

  const onClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
  };

  if (!supportsPWA || isInstalled) return null;

  return (
    <Button 
      onClick={onClick} 
      variant="outline" 
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 flex items-center gap-2"
      title="Installer l'application sur votre appareil"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Installer l'App</span>
    </Button>
  );
}
