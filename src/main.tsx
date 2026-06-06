import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.tsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Enregistrement du Service Worker avec gestion des erreurs
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Optionnel: informer l'utilisateur qu'une mise à jour est dispo
      console.log('Mise à jour disponible pour la PWA.');
    },
    onOfflineReady() {
      console.log('La PWA est prête pour un usage hors-ligne.');
    },
  });
}

// Gestionnaire d'erreurs global - évite la page blanche
window.addEventListener('error', (event) => {
  // Erreur de chargement de chunk (JS manquant après déploiement)
  if (
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('ChunkLoadError') ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Loading CSS chunk')
  ) {
    console.warn('[REX] Chunk manquant détecté, rechargement...');
    window.location.reload();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk')
  ) {
    console.warn('[REX] Chunk manquant (promise), rechargement...');
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
