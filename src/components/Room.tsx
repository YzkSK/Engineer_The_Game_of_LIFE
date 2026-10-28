import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { cpuAction } from '../game/cpu';
import { GOAL } from '../game/data';
import { replay } from '../game/replay';
import type { Action, GameState, Tech } from '../game/types';
import { addCpu, joinRoom, pushAction, signIn, startGame, subscribe, type Room as RoomData } from '../sync/firebase';
import { Game, type Anim } from './Game';
import { CardPopup } from './Panels';
import { Lobby, Result } from './Screens';

const roomId = new URLSearchParams(location.search).get('id') ?? '';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 新しい roll が届いたら、サイコロ(約1秒)→駒を1マスずつ移動、の順で表示用の位置を作る。連続して届いたら順番待ち
function useRollAnim(actions: Action[]) {
  const [anim, setAnim] = useState<Anim | null>(null);
  const seen = useRef<number | null>(null);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);

  useEffect(() => {
    const n = actions.length;
    const first = seen.current === null;
    if (seen.current === n) return; // actions以外(players等)の更新で同じrollを再生しない
    seen.current = n;
    const last = actions[n - 1];
    if (first || last?.type !== 'roll') return; // 初回表示(途中参加・再読み込み)は演出しない
    const before = replay(actions.slice(0, -1));
    const after = replay(actions);
    const mover = before.current;
    const r = after.rolled ?? 0;
    const base = before.players.map((p) => p.position);
    pending.current++;
    queue.current = queue.current.then(async () => {
      setAnim({ pos: base, mover, die: r, rolling: true });
      await sleep(900);
      setAnim({ pos: base, mover, die: r, rolling: false });
      await sleep(250);
      for (let i = 1; i <= r; i++) {
        const pos = base.map((v, k) => (k === mover ? Math.min(v + i, GOAL) : v));
        setAnim({ pos, mover, die: r, rolling: false });
        await sleep(240);
      }
      if (--pending.current === 0) setAnim(null);
    });
  }, [actions]);

  return anim;
}

// 時代が変わったら、そのとき引いたカードを出す
function useCardPopup(state: GameState) {
  const [popup, setPopup] = useState<{ cards: NonNullable<GameState['lastCards']>; era: number } | null>(null);
  const era = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== 'playing') return;
    if (era.current !== null && era.current !== state.era && state.lastCards) setPopup({ cards: state.lastCards, era: state.era });
    era.current = state.era;
  }, [state.era, state.status]);
  return [popup, () => setPopup(null)] as const;
}

export default function Room() {
  const [uid, setUid] = useState('');
  const [room, setRoom] = useState<RoomData | null>(null);
  const joining = useRef(false);

  useEffect(() => {
    let off = () => {};
    if (!/^[a-z0-9]+$/.test(roomId)) return setRoom({ meta: null, players: {}, actions: [] }); // id無し・不正は「見つかりません」へ
    signIn().then((u) => {
      setUid(u);
      off = subscribe(roomId, setRoom);
    });
    return () => off();
  }, []);

  const state = useMemo(() => replay(room?.actions ?? []), [room]);
  const isHost = !!room?.meta && room.meta.hostUid === uid;
  const count = room?.actions.length ?? 0;
  const cur = state.players[state.current];
  const anim = useRollAnim(room?.actions ?? []);
  const [popup, closePopup] = useCardPopup(state);

  // ロビーに自分がいなければ参加
  useEffect(() => {
    if (!room?.meta || !uid || room.players[uid] || room.meta.status !== 'lobby' || joining.current) return;
    joining.current = true;
    const name = (localStorage.getItem('name') || prompt('名前を入力') || '').trim().slice(0, 20) || 'player'; // ルールの20文字制限に合わせる
    localStorage.setItem('name', name);
    joinRoom(roomId, name).catch(() => { joining.current = false; });
  }, [room, uid]);

  // CPU手番はホストが代行(二重書き込みは連番の未存在ルールで弾かれる)
  useEffect(() => {
    if (!isHost || state.status !== 'playing' || !cur?.isCpu) return;
    const t = setTimeout(() => pushAction(roomId, count, cpuAction(state)), 600);
    return () => clearTimeout(t);
  }, [isHost, state, count]);

  if (!room) return <p class="muted" style={{ padding: '20px' }}>読み込み中...</p>;
  if (!room.meta) return <p class="muted" style={{ padding: '20px' }}>部屋が見つかりません</p>;

  const send = (a: { type: Action['type']; tech?: Tech }) => pushAction(roomId, count, { ...a, by: uid } as Action);
  const list = Object.entries(room.players).sort(([, a], [, b]) => a.order - b.order);

  if (state.status === 'lobby') {
    const start = async () => {
      const players = list.map(([id, p]) => ({ uid: id, name: p.name, isCpu: p.isCpu }));
      const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
      await startGame(roomId, count, { type: 'start', by: uid, players, seed } as Action);
    };
    return <Lobby list={list} uid={uid} isHost={isHost} onAddCpu={() => addCpu(roomId, list.length)} onStart={start} />;
  }

  if (state.status === 'finished' && !anim) return <Result s={state} />;

  return (
    <Game state={state} actions={room.actions} uid={uid} roomId={roomId} anim={anim} send={send}>
      {popup && !anim && <CardPopup s={state} cards={popup.cards} onClose={closePopup} />}
    </Game>
  );
}
