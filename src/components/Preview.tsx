import { cpuAction } from '../game/cpu';
import { initialState, reduce } from '../game/reducer';
import { replay } from '../game/replay';
import type { Action, GameState } from '../game/types';
import { CardPopup } from './Panels';
import { Game } from './Game';
import { Result } from './Screens';

// 開発用: Firebase なしで固定の actions を replay して Game と同じ部品を描く。?view=result で結果画面、?view=card でカード
const players = [
  { uid: 'u1', name: 'あなた', isCpu: false },
  { uid: 'u2', name: 'ミナミ', isCpu: false },
  { uid: 'u3', name: 'ケン', isCpu: true },
  { uid: 'u4', name: 'ユイ', isCpu: true },
];
const actions: Action[] = [{ type: 'start', by: 'u1', players, seed: 12345 }];
let s: GameState = reduce(initialState, actions[0]!);
const view = new URLSearchParams(location.search).get('view');
// 時代3に入って、あなたの手番(振る前)になるまで、全員 roll → endTurn を繰り返す(上限付き)
for (let i = 0; i < 2000 && s.status === 'playing'; i++) {
  if (view !== 'result' && s.era >= 3 && s.current === 0 && s.rolled === null) break;
  const a = cpuAction(s);
  actions.push(a);
  s = reduce(s, a);
}

export default function Preview() {
  const state = replay(actions);
  if (state.status === 'finished') return <Result s={state} />;
  return (
    <Game state={state} actions={actions} uid="u1" roomId="K7QX" anim={null} send={() => {}}>
      {view === 'card' && state.lastCards && <CardPopup s={state} cards={state.lastCards} onClose={() => {}} />}
    </Game>
  );
}
