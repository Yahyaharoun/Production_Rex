import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — Fond premium vert/blanc pour toutes les pages d'authentification.
 * Deux colonnes sur desktop : colonne décorative à gauche, formulaire à droite.
 */
export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Colonne décorative — visible uniquement sur desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent/10 flex-col items-center justify-center relative overflow-hidden border-r border-border">
        {/* Cercles décoratifs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 text-center px-12">
          {/* Logo Rex grand format */}
          <div className="mx-auto mb-6 w-24 h-24 rounded-3xl bg-accent flex items-center justify-center shadow-2xl shadow-accent/30">
            <span className="text-white font-black text-5xl select-none">R</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Rex</h1>
          <p className="text-lg text-accent font-semibold mb-2">Système de Transport</p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Gérez votre flotte, vos chauffeurs et votre production quotidienne en toute simplicité.
          </p>

          {/* Badges features */}
          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              '✅ Gestion des véhicules & chauffeurs',
              '📊 Production quotidienne en temps réel',
              '📄 Rapports PDF professionnels',
              '🔒 Accès sécurisé par rôle',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 bg-card/50 border border-border rounded-lg px-4 py-2.5 text-sm text-white">
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne formulaire */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Déco fond */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
