import { useEffect, useRef, useState } from 'preact/hooks';
import * as D from '../game/data';
import { AI_CARDS, TECHS, TREND_CARDS, type Card } from '../game/data';
import type { GameState, Player, Tech } from '../game/types';

export const TECH_NAME: Record<Tech, string> = {
  web: 'Web', mobile: 'スマホアプリ', infra: 'インフラ', data: 'データ分析', legacy: '古いシステム',
};
const CWD = ['training', 'client-town', 'ai-lab', 'tech-mountains', 'port'];
export const PCOLOR = ['var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)'];
export const pc = (i: number) => PCOLOR[i % PCOLOR.length]!;

// 文字で描くメーター: ████░░░░
function Blocks({ val, max, cells, color }: { val: number; max: number; cells: number; color: string }) {
  const n = Math.max(0, Math.min(cells, Math.round((val / max) * cells)));
  return (
    <span class="bar">
      <span style={{ color }}>{'█'.repeat(n)}</span>
      <span class="muted" style={{ opacity: 0.5 }}>{'░'.repeat(cells - n)}</span>
    </span>
  );
}

export function Trend({ s }: { s: GameState }) {
  const lv = (v: number) => (v >= 4 ? 'var(--t-green)' : v >= 3 ? 'var(--title)' : 'var(--t-red)');
  return (
    <section class="win">
      <h2 class="win-t">技術の人気度</h2>
      <span class="win-m">時代{s.era}の流行カードで更新</span>
      <div class="win-b meters">
        {TECHS.map((t) => {
          const d = s.popularity[t] - s.prevPopularity[t];
          return (
            <div class="mrow" key={t}>
              <span>{TECH_NAME[t]}</span>
              <Blocks val={s.popularity[t]} max={5} cells={15} color={lv(s.popularity[t])} />
              <span class="v">{s.popularity[t]}/5</span>
              <span class={`d ${d > 0 ? 'green' : d < 0 ? 'red' : 'muted'}`}>{d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '−'}</span>
            </div>
          );
        })}
        {s.aiLevel > 0 && (
          <div class="mrow">
            <span class="magenta">AIの進化</span>
            <Blocks val={s.aiLevel} max={3} cells={15} color="var(--t-magenta)" />
            <span class="v">Lv{s.aiLevel}</span>
            <span class="d muted" />
          </div>
        )}
      </div>
    </section>
  );
}

export function Players({ s, pos }: { s: GameState; pos: number[] }) {
  const row = (k: string, val: number, max: number, text: string, color: string) => (
    <div class="mrow">
      <span class="muted">{k}</span>
      <Blocks val={val} max={max} cells={12} color={color} />
      <span class="v">{text}</span>
    </div>
  );
  return (
    <section class="win">
      <h2 class="win-t">プレイヤー</h2>
      <div class="players-b ruled" style={{ paddingTop: '10px' }}>
        {s.players.map((p: Player, i) => {
          const turn = i === s.current;
          const resting = p.restTurns > 0;
          return (
            <div key={p.uid} class={`pl ${turn ? 'turn' : ''} ${resting ? 'resting' : ''}`}>
              <div class="pl-head">
                <span class="chip" style={{ '--pc': pc(i), width: '22px', height: '22px', fontSize: '13px' }}>{p.name[0]}</span>
                <span><span class="name">{p.name}</span> <span class="route">会社員{p.isCpu ? ' / CPU' : ''}</span></span>
                <span class={`state ${p.retired || (resting && !turn) ? 'red' : 'muted'}`}>
                  {p.retired ? '引退' : turn ? '手番' : resting ? '休職中' : ''}
                </span>
              </div>
              <div class="where">{pos[i]! + 1}/{D.BOARD.length}マス目 {D.ERAS[Math.floor(pos[i]! / D.ERA_SIZE)]!.place} {Math.floor(pos[i]! / 3) + 1}年目</div>
              {row('お金', p.money, 600, `${p.money}万`, 'var(--title)')}
              {row('スキル', p.skill, 25, `${p.skill}`, 'var(--t-cyan)')}
              {row('メンタル', p.mental, 10, `${p.mental}/10`, p.mental <= 3 ? 'var(--t-red)' : 'var(--t-green)')}
              {row('評判', p.reputation, 20, `${p.reputation}`, 'var(--t-magenta)')}
              <div class="stack">
                技術: <span>{p.techs.map((t) => TECH_NAME[t]).join(', ') || 'なし'}</span>
                {s.aiLevel > 0 && <> / AIカード: <span>{p.aiCards}{p.aiActive ? '(使用予定)' : ''}</span></>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

export function Controls({ s, name, mine, busy, rolling, die, send }: {
  s: GameState; name: string; mine: boolean; busy: boolean; rolling: boolean; die: number | null;
  send: (a: { type: 'roll' | 'endTurn' | 'useAiCard' | 'learnTech'; tech?: Tech }) => void;
}) {
  const p = s.players[s.current]!;
  const pre = s.rolled === null; // 振る前だけ学習・AIカードが使える
  const can = mine && !busy;
  const go = () => can && send({ type: pre ? 'roll' : 'endTurn' });
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      goRef.current();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  // 転がっている間は mock と同じく80msごとにランダムな目を出す
  const [flick, setFlick] = useState(1);
  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setFlick(1 + Math.floor(Math.random() * 6)), 80);
    return () => clearInterval(t);
  }, [rolling]);
  if (rolling) die = flick;
  const cmd = pre ? (p.aiActive ? './roll --ai-pair' : './roll') : './end-turn';
  return (
    <section class="win focus">
      <h2 class="win-t">{mine ? 'あなたの番' : `${name}の番`}</h2>
      <div class="win-b act">
        <div class={`die ${(die ?? 5) === 1 ? 'one' : ''} ${rolling ? 'rolling' : ''}`} aria-label={`サイコロ: ${die ?? '-'}`}>
          {/* 振る前は mock と同じく5の目を出す */}
          {Array.from({ length: 9 }, (_, i) => <i key={i} class={PIPS[die ?? 5]!.includes(i) ? 'on' : ''} />)}
        </div>
        <div>
          <div class="prompt"><span class="ps">{mine ? 'you' : name}@life</span>:~/{CWD[s.era - 1]}$ <span>{cmd}</span></div>
          <div class="hint">AIカードを使うと次の案件の報酬が増えます。ただし使いすぎるとスキルが伸びません。</div>
          {can && pre && (
            <div class="hint">
              技術を学ぶ({D.LEARN_COST}万円・{D.LEARN_REST}回休み):{' '}
              {TECHS.filter((t) => !p.techs.includes(t)).map((t) => (
                <button key={t} class="check learn" disabled={p.money < D.LEARN_COST} onClick={() => send({ type: 'learnTech', tech: t })}><b>{TECH_NAME[t]}</b></button>
              ))}
            </div>
          )}
        </div>
        <div class="hand">
          {s.aiLevel > 0 && (
            <button class={`check ${p.aiActive ? 'on' : ''}`} disabled={!can || !pre || p.aiCards <= 0 || p.aiActive} onClick={() => send({ type: 'useAiCard' })}>
              <b>AIカード</b> を使う({p.aiCards}枚)
            </button>
          )}
          <span class="muted">技術: <span style={{ color: 'var(--ink)' }}>{p.techs.map((t) => TECH_NAME[t]).join(', ') || 'なし'}</span></span>
        </div>
        <button class="btn primary" disabled={!can} onClick={go}>{pre ? 'サイコロを振る' : '手番を終える'}<span class="key">Enter</span></button>
      </div>
    </section>
  );
}

// 前の人気度 cur にカードを当てた差分を diff 形式で表示する(cur は更新される)
function CardView({ file, card, cur }: { file: string; card: Card; cur: Record<Tech, number> }) {
  const lines = (Object.entries(card.delta) as [Tech, number][]).map(([t, d]) => {
    const old = cur[t];
    cur[t] = Math.min(5, Math.max(1, old + d));
    return { t, old, now: cur[t] };
  });
  return (
    <>
      <h3 class="card-name">{card.name}</h3>
      <div class="diff">
        <div class="hunk">@@ {file} @@</div>
        {lines.flatMap(({ t, old, now }) => [
          <div key={`${t}-`} class="del">- {TECH_NAME[t]}: {old}</div>,
          <div key={`${t}+`} class="add">+ {TECH_NAME[t]}: {now}</div>,
        ])}
      </div>
    </>
  );
}

export function CardPopup({ s, cards, onClose }: { s: GameState; cards: NonNullable<GameState['lastCards']>; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const cur = { ...s.prevPopularity };
  return (
    <div class="overlay open">
      <section class="win" role="dialog" aria-label="流行カード">
        <h2 class="win-t">流行カード</h2>
        <div class="win-b">
          <CardView file="trend.yml" card={TREND_CARDS[cards.trend]!} cur={cur} />
          {cards.ai !== null && <CardView file="ai.yml" card={AI_CARDS[cards.ai]!} cur={cur} />}
          <div class="card-actions"><button class="btn primary" autofocus onClick={onClose}>閉じる<span class="key">Esc</span></button></div>
        </div>
      </section>
    </div>
  );
}
