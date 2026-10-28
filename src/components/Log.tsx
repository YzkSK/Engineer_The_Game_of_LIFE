import { useMemo } from 'preact/hooks';
import { AI_APPEAR_ERA, AI_CARDS, BOARD, LEARN_COST, LEARN_REST, TREND_CARDS, type Card } from '../game/data';
import { initialState, reduce } from '../game/reducer';
import type { Action, GameState, Tech } from '../game/types';
import { TYPES } from './Board';
import { pc, TECH_NAME } from './Panels';

interface Entry { t: number; lv: 'error' | 'warn' | 'ai' | 'info'; who: number; text: string }

const sign = (n: number) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;
const cardText = (c: Card) => (Object.entries(c.delta) as [Tech, number][]).map(([t, d]) => `${TECH_NAME[t]} ${sign(d)}`).join('、');

// actions を1件ずつ replay して、前後の state の差分から文を作る(新しい順)
export function buildLog(actions: Action[]): Entry[] {
  const out: Entry[] = [];
  let s = initialState;
  for (const a of actions) {
    const b = s;
    s = reduce(s, a);
    if (a.type === 'start' || s === b) continue;
    const t = b.turn;
    const i = b.current;
    const bp = b.players[i]!;
    const ap = s.players[i]!;
    const es: Entry[] = [];
    const add = (lv: Entry['lv'], text: string, who = i) => es.push({ t, lv, who, text });

    if (a.type === 'roll') {
      const type = BOARD[ap.position]!;
      const rested = ap.restTurns > bp.restTurns;
      const eff = [
        ['お金', ap.money - bp.money, '万'],
        ['スキル', ap.skill - bp.skill, ''],
        ['メンタル', rested ? 0 : ap.mental - bp.mental, ''],
        ['評判', ap.reputation - bp.reputation, ''],
      ].filter((x) => x[1]).map(([k, n, u]) => `${k} ${sign(n as number)}${u}`).join('、');
      add(type === 'fire' ? 'error' : type === 'event' ? 'warn' : type === 'ai' ? 'ai' : 'info',
        `は ${s.rolled} 進んで、${ap.position + 1}マス目の${TYPES[type].nm}に止まった${eff ? `。${eff}` : ''}`);
      if (rested) add('warn', `はメンタルが尽きて休職。あと${ap.restTurns}回休み`);
      if (ap.retired) add('info', 'は引退した');
      for (let e = b.era + 1; e <= s.era; e++) {
        const last = e === s.era && s.lastCards;
        add('info', `時代${e}に入った${last ? `。流行カード「${TREND_CARDS[last.trend]!.name}」${cardText(TREND_CARDS[last.trend]!)}` : ''}`, -1);
        if (e === AI_APPEAR_ERA) add('ai', '時代' + e + 'に入り、AI が登場した。これから AI カードが手に入る', -1);
        if (last && last.ai !== null) add('ai', `AI進化カード「${AI_CARDS[last.ai]!.name}」${cardText(AI_CARDS[last.ai]!)}`, -1);
      }
    } else if (a.type === 'learnTech') {
      add('info', `は ${TECH_NAME[a.tech]} を学んだ。お金 −${LEARN_COST}万、${LEARN_REST}回休み`);
    } else if (a.type === 'useAiCard') {
      add('ai', 'は AI カードを使った。次の案件の報酬が増える');
    } else if (a.type === 'endTurn') {
      s.players.forEach((p, k) => {
        if (p.restTurns < b.players[k]!.restTurns) add('warn', `は休職中。あと${p.restTurns}回休み`, k);
      });
    }
    out.unshift(...es);
  }
  return out.slice(0, 40);
}

export function Log({ actions, state }: { actions: Action[]; state: GameState }) {
  const entries = useMemo(() => buildLog(actions), [actions]);
  return (
    <section class="win">
      <h2 class="win-t">ログ</h2>
      <div class="log ruled">
        {entries.map((e, k) => (
          <div key={k}>
            <span class="muted">T{e.t}</span>
            <span class={`lv ${e.lv}`}>{e.lv.toUpperCase()}</span>
            <span>
              {e.who >= 0 && <><b style={{ color: pc(e.who) }}>{state.players[e.who]?.name}</b> </>}
              {e.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
