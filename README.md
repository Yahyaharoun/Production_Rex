# Production Rex - ERP Transport

Production Rex est une solution ERP (Enterprise Resource Planning) complète développée spécifiquement pour la gestion des agences de transport. Elle permet une gestion centralisée des agences, des véhicules, des chauffeurs, du personnel et un suivi précis des productions et recettes journalières.

## 🚀 Fonctionnalités Principales

- **Gestion des Accès (RBAC)** : Système de permissions strict avec 4 rôles (PDG, CHEF_AGENCE, CAISSIERE, CHAUFFEUR).
- **Administration Centralisée** : Le PDG a une vue globale et un contrôle total sur l'ensemble des agences, des utilisateurs et des recettes.
- **Gestion des Agences** : Supervision par les Chefs d'Agence qui ne peuvent gérer que les ressources assignées à leur agence.
- **Production Journalière** : Suivi des recettes (montant chargé), des dépenses (carburant, péage, lavage, etc.) et calcul du net à verser.
- **Validation Multi-niveaux** : Workflow de validation pour les bordereaux de production (Soumis par les caissières, validés/rejetés par le Chef d'Agence/PDG).
- **Gestion de Flotte** : Suivi des véhicules (statut, immatriculation) et des chauffeurs.
- **Rapports Financiers** : Tableaux de bord intuitifs permettant la visualisation en temps réel des performances des agences.

## 🛠️ Technologies Utilisées

- **Frontend** : [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) + Shadcn UI
- **Backend / Base de données** : [Supabase](https://supabase.com/) (PostgreSQL, Auth, RLS, Edge Functions)
- **Hébergement Frontend** : [Vercel](https://vercel.com/)
- **Gestion d'état / Requêtes** : React Query (TanStack Query)
- **Routage** : React Router v6

## 🌐 Déploiement

L'application est déployée en production et accessible à l'adresse suivante :
[https://production-rex.vercel.app](https://production-rex.vercel.app)

## 🔐 Configuration et Sécurité

- La base de données Supabase utilise des **Row Level Security (RLS)** avancés pour garantir l'étanchéité des données entre les différentes agences.
- L'authentification est gérée via **Supabase Auth** avec des Edge Functions pour le contournement sécurisé lors de la création d'utilisateurs par les administrateurs.

## 👥 Comptes par défaut

En production, un compte principal est initialisé :
- **Rôle** : PDG
- **Email** : `Pdg@rex.cm`

*Les autres utilisateurs (Chefs d'agence, caissières) doivent être créés et gérés par la direction depuis l'interface d'administration.*
