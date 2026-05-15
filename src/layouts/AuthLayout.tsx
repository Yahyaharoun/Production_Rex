import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans">
      {/* Container Principal (La Carte) */}
      <div className="w-full max-w-[950px] min-h-[600px] bg-white rounded-[2.5rem] shadow-2xl flex overflow-hidden">
        
        {/* Partie Gauche (Vert avec bulles) */}
        <div className="hidden md:flex w-1/2 bg-primary relative overflow-hidden items-center p-14">
          {/* Décorations (Grandes bulles inspirées de l'image) */}
          <div className="absolute top-[-10%] left-[-20%] w-[350px] h-[350px] bg-white/10 rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-black/10 rounded-full" />
          <div className="absolute top-[50%] right-[-15%] w-[300px] h-[300px] bg-white/5 rounded-full" />
          
          <div className="relative z-10 text-white w-full">
            <h1 className="text-[2.75rem] font-black tracking-wider mb-1">WELCOME</h1>
            <p className="text-sm font-bold tracking-widest mb-6 opacity-90 uppercase">Rex Transport System</p>
            <p className="text-xs opacity-70 leading-relaxed max-w-[90%] font-medium">
              Connectez-vous pour accéder au tableau de bord, gérer votre flotte de véhicules, vos chauffeurs et effectuer le suivi de production en toute sécurité.
            </p>
          </div>
        </div>

        {/* Partie Droite (Formulaire) */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white relative">
           {/* Petites bulles discrètes en bas à droite comme sur l'image */}
           <div className="absolute bottom-[-10%] right-[-10%] w-[200px] h-[200px] bg-primary/10 rounded-full" />
           <div className="w-full max-w-[360px] z-10">
             <Outlet />
           </div>
        </div>
      </div>
    </div>
  );
};
