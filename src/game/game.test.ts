import { expect, test } from 'bun:test';
import { cpuAction } from './cpu';
import { initialState, reduce } from './reducer';
import { replay } from './replay';
import { score } from './score';
import type { Action, GameState, Player } from './types';

const players = [
  { uid: 'a', name: 'A', isCpu: false },
  { uid: 'b', name: 'B', isCpu: true },
];
const start = (seed = 1): Action => ({ type: 'start', by: 'a', players, seed });

// CPUだけで進める。stop が true を返したら止める(上限付き)
function run(s: GameState, actions: Action[] = [], stop: (s: GameState) => boolean = () => false) {
  for (let i = 0; i < 10000 && s.status === 'playing' && !stop(s); i++) {
    const a = cpuAction(s);
    actions.push(a);
    s = reduce(s, a);
  }
  return s;
}

test('同じシード・同じactionsなら同じ結果', () => {
  const actions: Action[] = [start(42)];
  run(reduce(initialState, actions[0]!), actions);
  expect(replay(actions)).toEqual(replay([...actions]));
  expect(replay(actions).status).toBe('finished');
  const other: Action[] = [start(43)];
  run(reduce(initialState, other[0]!), other);
  expect(replay(other)).not.toEqual(replay(actions));
});

test('手番外・不正なアクションは無視される', () => {
  const s = reduce(initialState, start());
  expect(reduce(s, { type: 'roll', by: 'b' })).toBe(s);
  expect(reduce(s, { type: 'endTurn', by: 'a' })).toBe(s); // 振る前
  expect(reduce(s, { type: 'useAiCard', by: 'a' })).toBe(s); // カードなし
  const rolled = reduce(s, { type: 'roll', by: 'a' });
  expect(reduce(rolled, { type: 'roll', by: 'a' })).toBe(rolled); // 二重roll
});

test('時代3でAIが登場する', () => {
  const s = reduce(initialState, start());
  expect(s.aiLevel).toBe(0);
  const s3 = run(s, [], (x) => x.era === 3);
  expect(s3.era).toBe(3);
  expect(s3.aiLevel).toBe(1);
  expect(s3.players.every((p) => p.aiCards === 1)).toBe(true);
});

test('メンタル0で休職する', () => {
  let s = reduce(initialState, start());
  // 全マスを炎上マスに見立てる代わりに、メンタル1にして振り続け、休職するまで試す
  s = { ...s, players: s.players.map((p, i) => (i === 0 ? { ...p, mental: 1 } : p)) };
  for (let i = 0; i < 50 && s.players[0]!.restTurns === 0; i++) {
    s = { ...s, current: 0, rolled: null, players: s.players.map((p, j) => (j === 0 ? { ...p, mental: 1 } : p)) };
    s = reduce(s, { type: 'roll', by: 'a' });
  }
  // 炎上マスに止まれば mental<=0 → 休職
  expect(s.players[0]!.restTurns).toBeGreaterThan(0);
  expect(s.players[0]!.mental).toBeGreaterThan(0);
});

test('満足度の計算', () => {
  const p = { money: 125, skill: 3, reputation: 2, mental: 4, bonus: 5 } as Player;
  expect(score(p)).toBe(12 + 6 + 4 + 4 + 5);
});

test('CPUだけで最後まで回してfinishedになる', () => {
  const s = run(reduce(initialState, start(7)));
  expect(s.status).toBe('finished');
  expect(s.era).toBe(5);
});
