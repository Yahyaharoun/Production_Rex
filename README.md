# Production Rex - ERP Transport

Production Rex est une solution ERP (Enterprise Resource Planning) complète développée spécifiquement pour la gestion des agences de transport. Elle permet une gestion centralisée des agences, des véhicules, du personnel et un suivi ultra-précis des productions et recettes journalières, **même en l'absence de connexion internet**.

## 🚀 Fonctionnalités Principales

- **Mode Hors-Ligne (Offline First) & PWA** : L'application fonctionne comme une vraie application mobile (iOS & Android) grâce à sa technologie PWA. Saisie des productions, des tickets et des carburants possible à 100% sans connexion internet avec un système de file d'attente robuste (Dexie.js).
- **Gestion des Accès (RBAC)** : Système de permissions strict avec 4 rôles majeurs (PDG, CHEF_AGENCE, AGENT PRODUCTION, CAISSIÈRE).
  - *Agent Production* : Émet les tickets passagers et le bordereau.
  - *Caissière* : Valide la recette et la comptabilité globale de la ligne.
- **Journal d'Activité Centralisé** : Suivi global des productions, carburants, lavages et dépenses avec totalisation instantanée en francs CFA.
- **Validation Multi-niveaux** : Workflow de validation pour les bordereaux de production (Soumis, validés/rejetés par le Chef d'Agence ou le PDG).
- **Rapports Financiers & PDF/Excel** : Tableaux de bord intuitifs permettant des exports détaillés par ligne et par véhicule (format paysage pour les PDF pour un maximum de détails : Recette Brute, Carburant Total, Total Dépenses, Net à Verser).

## 🛠️ Technologies Utilisées

- **Frontend** : [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **PWA & Offline** : `vite-plugin-pwa` (Service Workers) + [Dexie.js](https://dexie.org/) (Base de données locale IndexedDB)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI
- **Backend / Base de données** : [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS)
- **Hébergement Frontend** : [Vercel](https://vercel.com/)
- **Génération de documents** : jsPDF (Rapports visuels au format A4) + SheetJS (Excel)

## 🌐 Déploiement & Installation Mobile

L'application est déployée en production et accessible à l'adresse suivante :
[https://production-rex.vercel.app](https://production-rex.vercel.app)

**Installation sur Mobile (PWA) :**
- L'application ne nécessite pas de Play Store ou d'App Store.
- Accédez à l'URL via **Google Chrome (Android)** ou **Safari (iOS)**, puis cliquez sur **"Ajouter à l'écran d'accueil"** pour profiter du mode application en plein écran et de la pleine puissance du mode hors-ligne.

## 🔐 Sécurité & Architecture

- **Row Level Security (RLS)** : Supabase est configuré avec des règles RLS strictes garantissant l'étanchéité totale des données entre les différentes agences (Un Chef d'Agence ne voit que ses données).
- **Synchronisation Différée** : Les opérations réalisées hors connexion sont mises dans une file d'attente chiffrée locale (`sync_queue`) et sont remontées au serveur de manière transparente dès le retour de la connexion réseau (`navigator.onLine`).

## 👥 Comptes par défaut

En production, le compte principal est :
- **Rôle** : PDG
- **Email** : `Pdg@rex.cm`

*Les autres utilisateurs (Chefs d'agence, Agents Production, Caissières) doivent être créés et gérés depuis l'interface d'administration.*
