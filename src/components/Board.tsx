import { useLayoutEffect, useState } from 'preact/hooks';
import { ERA_SIZE, ERAS } from '../game/data';
import type { GameState, SquareType } from '../game/types';
import { computeGeo, H, PAL, REGIONS, RIVERS, SEA, SEGS, SPRITES, TOTAL, W, type Geo } from './mapgeo';
import { pc } from './Panels';

export const TYPES: Record<SquareType, { g: string; nm: string; c: string; fx: string; special?: boolean }> = {
  project: { g: '¥+', nm: '案件', c: 'job', fx: 'お金とスキルが増える。持っている技術の人気度で報酬が変わる' },
  fire: { g: '!!', nm: '炎上', c: 'fire', fx: 'メンタルが減る。乗り切ると評判が上がる' },
  study: { g: '{}', nm: '勉強', c: 'study', fx: 'お金を払ってスキルを上げる。新しい技術を覚えられる' },
  jobchange: { g: '⇄', nm: '転職', c: 'change', fx: '別のルートに移れる。評判が高いほど良い会社に入れる' },
  event: { g: '??', nm: 'イベント', c: 'event', fx: 'イベントカードを1枚引く' },
  legacy: { g: '$$', nm: 'レガシー案件', c: 'legacy', fx: '古いシステムを持っている人だけ大もうけ。持っていなければ何も起きない' },
  start: { g: '>_', nm: 'ふりだし', c: 'special', special: true, fx: '新卒で入社。ここから30年が始まる' },
  ai: { g: 'AI', nm: 'AI登場', c: 'change', special: true, fx: '必ず止まる。ここから AI カードが手に入るようになる' },
  branch: { g: '├┬', nm: '分かれ道', c: 'special', special: true, fx: 'マネージャー / スペシャリスト / フリーランス / 起業 から道を選ぶ' },
  goal: { g: 'EOF', nm: '上がり', c: 'special', special: true, fx: '定年。満足度を計算して順位が決まる' },
};

const yearOf = (i: number) => Math.floor(i / 3) + 1;

function Sprite({ name, x, y, s }: { name: string; x: number; y: number; s: number }) {
  const rows = SPRITES[name]!, w = rows[0]!.length, h = rows.length;
  return (
    <g transform={`translate(${x - w * s / 2} ${y - h * s}) scale(${s})`} shape-rendering="crispEdges">
      {rows.flatMap((row, j) => [...row].map((ch, i) => ch === '.' ? null : (
        <rect key={`${i}-${j}`} x={i} y={j} width="1.02" height="1.02" style={{ fill: PAL[ch] }} />
      )))}
    </g>
  );
}

const legendItems: [string, string][] = [['job', '案件'], ['fire', '炎上'], ['study', '勉強'], ['change', '転職'], ['event', 'イベント'], ['legacy', 'レガシー案件']];

function MapSvg({ geo, cur }: { geo: Geo; cur: number }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <pattern id="p-grass" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.3" style="fill:var(--t-green)" opacity=".35" /><circle cx="12" cy="11" r="1" style="fill:var(--t-green)" opacity=".3" /></pattern>
        <pattern id="p-city" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 0H40M0 0V40" style="stroke:var(--frame)" stroke-width="2" opacity=".14" /><rect x="8" y="8" width="10" height="10" style="fill:var(--frame)" opacity=".07" /><rect x="24" y="22" width="10" height="12" style="fill:var(--frame)" opacity=".07" /></pattern>
        <pattern id="p-circuit" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M0 12H20V30H48M30 0V18H48" fill="none" style="stroke:var(--t-magenta)" stroke-width="1.5" opacity=".25" /><circle cx="20" cy="30" r="2.5" style="fill:var(--t-magenta)" opacity=".3" /><circle cx="30" cy="18" r="2.5" style="fill:var(--t-magenta)" opacity=".3" /></pattern>
        <pattern id="p-slope" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 0V14" style="stroke:var(--title)" stroke-width="1.2" opacity=".2" /></pattern>
        <pattern id="p-waves" width="36" height="20" patternUnits="userSpaceOnUse"><path d="M2 12 Q 8 6, 14 12 T 26 12" fill="none" style="stroke:var(--water-line)" stroke-width="1.5" opacity=".45" /></pattern>
      </defs>

      <g class="grid">
        {Array.from({ length: 13 }, (_, k) => <line key={`v${k}`} x1={(k + 1) * 100} y1="0" x2={(k + 1) * 100} y2={H} />)}
        {Array.from({ length: 8 }, (_, k) => <line key={`h${k}`} x1="0" y1={(k + 1) * 100} x2={W} y2={(k + 1) * 100} />)}
        {'ABCDEFGHIJKLMN'.split('').map((c, i) => <text key={c} x={i * 100 + 50} y="18" text-anchor="middle">{c}</text>)}
        {Array.from({ length: 9 }, (_, i) => <text key={i} x="10" y={i * 100 + 56}>{i + 1}</text>)}
      </g>

      <g class="regions">
        {ERAS.map((era, e) => {
          const [x, y, w, h] = REGIONS[e]!.rect;
          return (
            <g key={e} class={`region ${e === cur ? 'cur' : ''}`}>
              <rect x={x} y={y} width={w} height={h} rx="24" style={{ fill: `color-mix(in srgb, var(--${era.line}) 14%, transparent)` }} />
              <rect x={x} y={y} width={w} height={h} rx="24" fill={`url(#p-${REGIONS[e]!.pat})`} />
              <rect class="edge" x={x} y={y} width={w} height={h} rx="24" style={{ stroke: `var(--${era.line})` }} />
            </g>
          );
        })}
      </g>

      <g class="water">
        <path class="sea" d={SEA} />
        {RIVERS.map((d) => <g key={d}><path class="water river" d={d} stroke-width="30" /><path class="water-line" d={d} /></g>)}
      </g>

      <g class="decor">
        {geo.landmarks.map((m) => (
          <g key={`${m.name}-${m.nm}`} class="landmark">
            <Sprite name={m.name} x={m.cx} y={m.cy} s={m.s} />
            <text x={m.cx} y={m.cy + 15} text-anchor="middle">{m.nm}</text>
          </g>
        ))}
        {geo.trees.map((t, i) => <Sprite key={i} name="tree" x={t.cx} y={t.cy} s={4} />)}
      </g>

      <g class="roads">
        {SEGS.map((d) => <path key={`e${d}`} class="edge" d={d} />)}
        <g class="bridges">
          {geo.bridges.map((d) => <g key={d}><path class="rail" d={d} /><path class="deck" d={d} /><path class="plank" d={d} /></g>)}
        </g>
        {SEGS.map((d) => <path key={`b${d}`} class="base" d={d} />)}
        {SEGS.map((d) => <path key={`d${d}`} class="dash" d={d} />)}
      </g>

      <g class="gates">
        {geo.gates.map((g, i) => (
          <g key={i}>
            <g class="gate" transform={`translate(${g.x} ${g.y}) rotate(${g.ang})`}>
              <rect class="post" x="-4" y="-26" width="8" height="10" /><rect class="post" x="-4" y="16" width="8" height="10" />
              <line class="beam" x1="0" y1="-26" x2="0" y2="26" />
            </g>
            {g.plate && (
              <g class="gate">
                <rect class="plate" x={g.plate.box[0]} y={g.plate.box[1]} width="66" height="22" />
                <text x={g.plate.cx} y={g.plate.box[1] + 16} text-anchor="middle">{g.plate.text}</text>
              </g>
            )}
          </g>
        ))}
        {geo.signs.map((sg) => (
          <g key={sg.label} class="sign">
            <line class="pole" x1={sg.x} y1={sg.pole[0]} x2={sg.x} y2={sg.pole[1]} />
            <rect class="plate" x={sg.box[0]} y={sg.box[1]} width="56" height="20" />
            <text x={sg.x} y={sg.box[1] + 15} text-anchor="middle">{sg.label}</text>
          </g>
        ))}
      </g>

      <g class="labels">
        {ERAS.map((era, e) => {
          const b = geo.labels[e]!;
          return (
            <g key={e} class={`label ${e === cur ? 'cur' : ''}`}>
              <text x={b[0]} y={b[1] + 24}>{e === cur ? '▶ ' : ''}{era.place} <tspan>時代{e + 1} {era.name}</tspan></text>
            </g>
          );
        })}
      </g>

      <g class="frame">
        <g class="cartouche">
          <rect class="box" x="535" y="40" width="335" height="135" /><rect class="box2" x="541" y="46" width="323" height="123" />
          <text class="t" x="560" y="88" style="font-size:29px">エンジニア人生 全図</text>
          <text class="s" x="560" y="113">1マス = 4か月 / 全{TOTAL}マス・30年</text>
          <g transform="translate(560 135)">
            {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={k * 36} y="0" width="36" height="8" style={{ fill: k % 2 ? 'var(--panel)' : 'var(--ink)', stroke: 'var(--ink)' }} />)}
            <text class="s" x="0" y="26">0</text><text class="s" x="180" y="26" text-anchor="middle">5年</text>
          </g>
          <g transform="translate(838 150)">
            <polygon points="0,-34 9,0 0,-6 -9,0" style="fill:var(--t-red)" /><polygon points="0,26 9,0 0,6 -9,0" style="fill:var(--muted)" />
            <text class="n" x="0" y="-38" text-anchor="middle">N</text>
          </g>
        </g>
        <g class="legend">
          <rect class="box" x="565" y="715" width="300" height="160" style="fill:var(--panel);stroke:var(--frame);stroke-width:2" />
          <text class="h" x="582" y="744">凡例</text>
          {legendItems.map(([t, nm], k) => (
            <g key={t}>
              <rect x={582 + (k % 2) * 140} y={758 + Math.floor(k / 2) * 24} width="14" height="14" style={{ fill: `var(--${t})` }} />
              <text x={602 + (k % 2) * 140} y={770 + Math.floor(k / 2) * 24}>{nm}</text>
            </g>
          ))}
          <rect x="582" y="832" width="14" height="14" style="fill:var(--special)" /><text x="602" y="844">ふりだし・分かれ道・上がり</text>
          <rect x="582" y="853" width="14" height="6" style="fill:var(--t-red)" /><text x="602" y="862">関所 = 時代の境目</text>
        </g>
      </g>
    </svg>
  );
}

// pos: 表示する各プレイヤーの位置(アニメ中は state と異なる)。hop: 今動いているプレイヤーの index。me: 自分の index(通過済みの表示に使う)
export function Board({ s, pos, hop, me }: { s: GameState; pos: number[]; hop: number | null; me: number }) {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [tip, setTip] = useState<{ i: number; left: number; top: number } | null>(null);
  // 道の長さの実測が要るので、ブラウザで描いてから一度だけ計算する
  useLayoutEffect(() => setGeo(computeGeo()), []);

  const showTip = (e: Event, i: number) => {
    const tile = e.currentTarget as HTMLElement, map = tile.closest('.map')!.getBoundingClientRect(), r = tile.getBoundingClientRect();
    setTip({ i, left: Math.min(r.right - map.left + 10, map.width - 268), top: Math.max(r.top - map.top, 0) });
  };
  const here = tip ? s.players.filter((_, k) => pos[k] === tip.i).map((p) => p.name).join('、') : '';
  const tipType = tip ? TYPES[(ERAS[Math.floor(tip.i / ERA_SIZE)]!.sq[tip.i % ERA_SIZE])!] : null;
  const tipEra = tip ? Math.floor(tip.i / ERA_SIZE) : 0;

  return (
    <section class="win">
      <h2 class="win-t">エンジニア人生 全図</h2>
      <div class="win-b">
        <div class="map-scroll">
          <div class="map">
            {geo && <MapSvg geo={geo} cur={s.era - 1} />}
            {geo && (
              <div>
                {geo.pts.map(([x, y], i) => {
                  const type = ERAS[Math.floor(i / ERA_SIZE)]!.sq[i % ERA_SIZE]!, t = TYPES[type];
                  return (
                    <div
                      key={i}
                      class={`tile t-${type} ${t.special ? 'special' : ''} ${i < (pos[me] ?? 0) ? 'passed' : ''}`}
                      tabIndex={0}
                      style={{ left: `${x / W * 100}%`, top: `${y / H * 100}%`, '--c': `var(--${t.c})` }}
                      onMouseEnter={(e) => showTip(e, i)} onFocus={(e) => showTip(e, i)}
                      onMouseLeave={() => setTip(null)} onBlur={() => setTip(null)}
                    >
                      <span class="no">{i + 1}</span><span>{t.g}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div class="pieces">
              {geo && s.players.map((p, k) => {
                const same = s.players.map((_, q) => q).filter((q) => pos[q] === pos[k]);
                const at = same.indexOf(k);
                const [x, y] = geo.pts[pos[k]!]!;
                return (
                  // 動いている駒は key に位置を含めて、1マスごとに hop を再生する
                  <div
                    key={hop === k ? `${p.uid}-${pos[k]}` : p.uid}
                    class={`piece ${k === s.current ? 'turn' : ''} ${p.restTurns > 0 ? 'rest' : ''} ${hop === k ? 'hop' : ''}`}
                    style={{ '--pc': pc(k), left: `calc(${x / W * 100}% + ${(at - (same.length - 1) / 2) * 46}px)`, top: `${y / H * 100}%`, zIndex: at + 1 }}
                  >
                    <span class="tip-end" /><span class="head">{p.name[0]}</span><span class="name">{p.name}</span>
                  </div>
                );
              })}
            </div>
            {tip && tipType && (
              <div class="tip show" style={{ left: `${tip.left}px`, top: `${tip.top}px`, transform: "translateY(calc(-100% - 10px))" }}>
                <b>{tipType.nm}</b>
                <div class="m">{tip.i + 1}マス目 / {ERAS[tipEra]!.place}(時代{tipEra + 1})/ {yearOf(tip.i)}年目</div>
                <div>{tipType.fx}</div>
                {here && <div class="m">ここにいる人: {here}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
