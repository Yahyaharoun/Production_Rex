/**
 * offlineAuth.ts
 * Gestion de l'authentification hors ligne.
 * - Lors d'une connexion réussie en ligne, on stocke un hash PBKDF2 du mot de passe
 *   ainsi que le profil utilisateur dans IndexedDB (via Dexie).
 * - Lors d'une tentative hors ligne, on vérifie le mot de passe saisi contre ce hash.
 */
import { db } from './dexie';

const ITERATIONS = 100_000;
const HASH_ALGO = 'SHA-256';
const KEY_LEN = 256;

/** Encode une chaîne en Uint8Array */
const enc = (s: string) => new TextEncoder().encode(s);

/** Dérive une clé PBKDF2 à partir d'un mot de passe et d'un sel */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: HASH_ALGO },
    baseKey,
    { name: 'HMAC', hash: HASH_ALGO, length: KEY_LEN },
    true,
    ['sign']
  );
}

/** Convertit un ArrayBuffer en string base64 */
function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/** Convertit une string base64 en Uint8Array */
function base64ToBuf(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
}

/** Hash un mot de passe avec un sel aléatoire et retourne {hash, salt} */
async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const exported = await crypto.subtle.exportKey('raw', key);
  return {
    hash: bufToBase64(exported),
    salt: bufToBase64(salt),
  };
}

/** Vérifie un mot de passe contre un hash + sel stockés */
async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  try {
    const salt = base64ToBuf(storedSalt);
    const key = await deriveKey(password, salt);
    const exported = await crypto.subtle.exportKey('raw', key);
    return bufToBase64(exported) === storedHash;
  } catch {
    return false;
  }
}

/**
 * Sauvegarde un utilisateur dans IndexedDB après une connexion réussie en ligne.
 * Appelé depuis LoginPage après signInWithPassword réussi.
 */
export async function cacheUserCredentials(
  email: string,
  password: string,
  profile: {
    id: string;
    name: string;
    role: string;
    agence_id?: string;
    line_ids?: string[];
    is_active?: boolean;
  },
  token: string
) {
  try {
    const { hash, salt } = await hashPassword(password);
    await db.offlineUsers.put({
      email: email.toLowerCase().trim(),
      userId: profile.id,
      passwordHash: hash,
      passwordSalt: salt,
      profile: {
        id: profile.id,
        name: profile.name || 'Utilisateur',
        role: (profile.role || 'CAISSIERE').toUpperCase(),
        agenceId: profile.agence_id || '',
        lineIds: profile.line_ids || (profile.agence_id ? [profile.agence_id] : []),
        isActive: profile.is_active ?? true,
      },
      // On stocke le token pour la restauration de session (il peut expirer,
      // mais zustand/persist a déjà son propre token via localStorage)
      lastToken: token,
      cachedAt: new Date().toISOString(),
    });
  } catch (err) {
    // Erreur non bloquante
    console.warn('[offlineAuth] Impossible de mettre en cache les credentials:', err);
  }
}

/**
 * Tente une connexion hors ligne.
 * Retourne l'utilisateur mis en cache si les credentials correspondent,
 * sinon null.
 */
export async function offlineLogin(email: string, password: string): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  agenceId: string;
  lineIds: string[];
  isActive: boolean;
} | null> {
  try {
    const cached = await db.offlineUsers.get(email.toLowerCase().trim());
    if (!cached) return null;

    const valid = await verifyPassword(password, cached.passwordHash, cached.passwordSalt);
    if (!valid) return null;

    if (cached.profile.isActive === false) return null;

    return {
      id: cached.userId,
      email: email.toLowerCase().trim(),
      ...cached.profile,
    };
  } catch (err) {
    console.warn('[offlineAuth] Erreur lors de la connexion hors ligne:', err);
    return null;
  }
}
