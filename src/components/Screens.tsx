import { score, scoreParts } from '../game/score';
import type { GameState } from '../game/types';
import { pc } from './Panels';

type Entry = [string, { name: string; isCpu: boolean }];

export function Lobby({ list, uid, isHost, onAddCpu, onStart }: {
  list: Entry[]; uid: string; isHost: boolean; onAddCpu: () => void; onStart: () => void;
}) {
  return (
    <div class="narrow">
      <section class="win">
        <h2 class="win-t">ロビー</h2>
        <div class="win-b">
          <div class="muted">招待用のURL</div>
          <div class="url">
            <input readOnly value={location.href} aria-label="招待用のURL" />
            <button class="btn" onClick={() => navigator.clipboard.writeText(location.href)}>コピー</button>
          </div>
          <ul class="lobby-list">
            {list.map(([id, p], i) => (
              <li key={id}>
                <span class="chip" style={{ '--pc': pc(i) }}>{i + 1}</span>
                {p.name}{p.isCpu ? ' (CPU)' : ''}{id === uid ? ' (あなた)' : ''}
              </li>
            ))}
          </ul>
          {isHost ? (
            <div class="row">
              <button class="btn" onClick={onAddCpu}>CPUを追加</button>
              <button class="btn primary" onClick={onStart}>ゲームを始める</button>
            </div>
          ) : <p class="muted">ホストが開始するのを待っています</p>}
        </div>
      </section>
    </div>
  );
}

const BD_LABELS: [string, string][] = [
  ['お金', 'event'], ['スキル', 'study'], ['評判', 'change'], ['メンタル', 'job'], ['ボーナス', 'fire'],
];

export function Result({ s }: { s: GameState }) {
  const ranked = [...s.players].sort((a, b) => score(b) - score(a));
  const max = Math.max(1, score(ranked[0]!));
  return (
    <div class="result">
      <section class="win">
        <h2 class="win-t">30年の結果</h2>
        <div class="win-b">
          <h1>満足度ランキング</h1>
          <div class="bd-legend">
            {BD_LABELS.map(([k, c]) => <span key={k}><i style={{ '--c': `var(--${c})` }} />{k}</span>)}
          </div>
          {ranked.map((p, i) => {
            const total = score(p);
            return (
              <div key={p.uid} class={`rank ${i === 0 ? 'first' : ''}`}>
                <span class="pos">{i + 1}</span>
                <div>
                  <div class="who">
                    <span class="chip" style={{ '--pc': pc(s.players.indexOf(p)) }}>{p.name[0]}</span>
                    {p.name}{i === 0 && <span class="badge">優勝</span>}
                  </div>
                </div>
                <div class="score">{total}<small> 点</small></div>
                <div class="breakdown" style={{ width: `${(total / max) * 100}%` }}>
                  {scoreParts(p).map((v, j) => <i key={j} style={{ width: `${total > 0 ? (Math.max(0, v) / total) * 100 : 0}%`, background: `var(--${BD_LABELS[j]![1]})` }} />)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div class="result-actions"><a class="btn primary" href={import.meta.env.BASE_URL}>もう一度遊ぶ</a></div>
    </div>
  );
}
