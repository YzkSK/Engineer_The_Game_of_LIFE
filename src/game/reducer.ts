import * as D from './data';
import { randInt } from './rng';
import type { Action, GameState, Player, Tech } from './types';

export const initialState: GameState = {
  status: 'lobby',
  players: [],
  current: 0,
  era: 1,
  eraTurn: 0,
  popularity: { ...D.INITIAL_POPULARITY },
  aiLevel: 0,
  rng: 0,
  rolled: null,
};

const setCurrent = (s: GameState, p: Player): GameState => ({
  ...s,
  players: s.players.map((q, i) => (i === s.current ? p : q)),
});

function applyCard(s: GameState, delta: D.Card['delta']): GameState {
  const popularity = { ...s.popularity };
  for (const t of D.TECHS) popularity[t] = Math.min(5, Math.max(1, popularity[t] + (delta[t] ?? 0)));
  return { ...s, popularity };
}

function draw(s: GameState, deck: D.Card[]): GameState {
  const [i, rng] = randInt(s.rng, deck.length);
  return applyCard({ ...s, rng }, deck[i]!.delta);
}

function enterEra(s: GameState, era: number): GameState {
  if (era > D.ERA_TURNS.length) return { ...s, status: 'finished' };
  s = draw({ ...s, era, eraTurn: 0 }, D.TREND_CARDS);
  if (era >= D.AI_APPEAR_ERA) {
    s = draw({ ...s, aiLevel: s.aiLevel + 1 }, D.AI_CARDS);
    s = { ...s, players: s.players.map((p) => ({ ...p, aiCards: p.aiCards + 1 })) }; // 仮: 時代ごとに1枚配布
  }
  return s;
}

function endRound(s: GameState): GameState {
  const eraTurn = s.eraTurn + 1;
  return eraTurn >= D.ERA_TURNS[s.era - 1]! ? enterEra(s, s.era + 1) : { ...s, eraTurn };
}

// 止まったマスの効果
function resolveSquare(s: GameState, p: Player): GameState {
  const gain = (n: number) => (p.aiUsed >= D.AI_OVERUSE ? 0 : n);
  switch (D.BOARD[p.position]) {
    case 'project': {
      let money = D.PROJECT_BASE + D.PROJECT_PER_POP * p.techs.reduce((a, t) => a + s.popularity[t], 0);
      if (p.aiActive) {
        money = Math.round(money * (1 + D.AI_BOOST_PER_LEVEL * s.aiLevel));
        p = { ...p, aiActive: false, aiCards: p.aiCards - 1, aiUsed: p.aiUsed + 1 };
      }
      p = { ...p, money: p.money + money, skill: p.skill + gain(1) };
      break;
    }
    case 'fire': {
      const [r, rng] = randInt(s.rng, 2);
      s = { ...s, rng };
      p = { ...p, mental: p.mental - 2, reputation: p.reputation + (r === 0 ? D.BONUS_FIRE : 0) };
      break;
    }
    case 'study':
      p = { ...p, money: p.money - 10, skill: p.skill + gain(2) };
      break;
    case 'jobchange':
      if (p.reputation >= 3) p = { ...p, money: p.money + 30 }; // 仮: 評判が高いと好条件
      break;
    case 'event': {
      const [r, rng] = randInt(s.rng, 3);
      s = { ...s, rng };
      if (r === 0) {
        if (p.techs.includes('legacy')) p = { ...p, money: p.money + D.LEGACY_JOB_REWARD };
      } else if (r === 1) p = { ...p, mental: p.mental + 1 };
      else p = { ...p, money: p.money + 20 };
      break;
    }
  }
  if (p.mental <= 0) p = { ...p, mental: D.REST_MENTAL, restTurns: p.restTurns + D.REST_TURNS };
  return setCurrent(s, p);
}

function endTurn(s: GameState): GameState {
  s = { ...s, rolled: null };
  for (;;) {
    s = { ...s, current: (s.current + 1) % s.players.length };
    if (s.current === 0) s = endRound(s);
    if (s.status === 'finished') return s;
    const p = s.players[s.current]!;
    if (p.restTurns <= 0) return s;
    s = setCurrent(s, { ...p, restTurns: p.restTurns - 1 });
  }
}

export function reduce(s: GameState, a: Action): GameState {
  if (a.type === 'start') {
    if (s.status !== 'lobby' || a.players.length < 1) return s;
    const players: Player[] = a.players.map((p) => ({
      ...p, ...D.START, techs: [], position: 0, restTurns: 0, aiCards: 0, aiActive: false, aiUsed: 0, bonus: 0,
    }));
    return enterEra({ ...initialState, status: 'playing', players, rng: a.seed }, 1);
  }
  const p = s.players[s.current];
  if (s.status !== 'playing' || !p || p.uid !== a.by) return s;
  switch (a.type) {
    case 'roll': {
      if (s.rolled !== null) return s;
      const [r, rng] = randInt(s.rng, 6);
      const moved = { ...p, position: (p.position + r + 1) % D.BOARD.length };
      return resolveSquare({ ...s, rng, rolled: r + 1 }, moved);
    }
    case 'learnTech':
      if (s.rolled !== null || p.techs.includes(a.tech) || !D.TECHS.includes(a.tech) || p.money < D.LEARN_COST) return s;
      return setCurrent(s, {
        ...p, money: p.money - D.LEARN_COST, techs: [...p.techs, a.tech as Tech], restTurns: p.restTurns + D.LEARN_REST,
      });
    case 'useAiCard':
      if (s.rolled !== null || p.aiCards <= 0 || p.aiActive) return s;
      return setCurrent(s, { ...p, aiActive: true });
    case 'endTurn':
      return s.rolled === null ? s : endTurn(s);
    default:
      return s;
  }
}
