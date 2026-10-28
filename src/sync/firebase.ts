// Firebase依存はこのファイルだけ
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, onValue, ref, set, update } from 'firebase/database';
import type { Action } from '../game/types';

const env = import.meta.env;
const app = initializeApp({
  apiKey: env.PUBLIC_FIREBASE_API_KEY,
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.PUBLIC_FIREBASE_DATABASE_URL,
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getDatabase(app);

export interface Meta { hostUid: string; createdAt: number; status: 'lobby' | 'playing' | 'finished' }
export interface RoomPlayer { name: string; isCpu: boolean; order: number }
export interface Room { meta: Meta | null; players: Record<string, RoomPlayer>; actions: Action[] }

const rnd = (n: number) => {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => a[b % a.length]).join('');
};

export async function signIn(): Promise<string> {
  await auth.authStateReady();
  return (auth.currentUser ?? (await signInAnonymously(auth)).user).uid;
}

export async function createRoom(name: string): Promise<string> {
  const uid = await signIn();
  const roomId = rnd(6);
  // metaを先に作らないと players のルール(host判定)が通らない
  await set(ref(db, `rooms/${roomId}/meta`), { hostUid: uid, createdAt: Date.now(), status: 'lobby' });
  await set(ref(db, `rooms/${roomId}/players/${uid}`), { name, isCpu: false, order: Date.now() });
  return roomId;
}

export async function joinRoom(roomId: string, name: string): Promise<void> {
  const uid = await signIn();
  await set(ref(db, `rooms/${roomId}/players/${uid}`), { name, isCpu: false, order: Date.now() });
}

export async function addCpu(roomId: string, n: number): Promise<void> {
  await set(ref(db, `rooms/${roomId}/players/cpu-${rnd(6)}`), { name: `CPU${n}`, isCpu: true, order: Date.now() });
}

// startアクションとstatus変更を1回の更新で書き、途中で切れても食い違わないようにする
export async function startGame(roomId: string, index: number, action: Action): Promise<void> {
  await update(ref(db, `rooms/${roomId}`), {
    [`actions/${String(index).padStart(6, '0')}`]: { ...action, at: Date.now() },
    'meta/status': 'playing',
  }).catch(() => {});
}

export function subscribe(roomId: string, cb: (room: Room) => void): () => void {
  return onValue(ref(db, `rooms/${roomId}`), (snap) => {
    const v = snap.val() ?? {};
    const actions = Object.entries((v.actions ?? {}) as Record<string, Action>)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, a]) => a);
    cb({ meta: v.meta ?? null, players: v.players ?? {}, actions });
  });
}

// 連番が既に使われていれば失敗(false)。呼び出し側は購読で最新を受けて再判定する
export async function pushAction(roomId: string, index: number, action: Action): Promise<boolean> {
  try {
    await set(ref(db, `rooms/${roomId}/actions/${String(index).padStart(6, '0')}`), { ...action, at: Date.now() });
    return true;
  } catch {
    return false;
  }
}
