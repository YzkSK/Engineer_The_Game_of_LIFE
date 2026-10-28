import type { ComponentChildren } from 'preact';
import { ERAS } from '../game/data';
import type { Action, GameState, Tech } from '../game/types';
import { Board } from './Board';
import { Log } from './Log';
import { Controls, Players, Trend } from './Panels';

export interface Anim { pos: number[]; mover: number; die: number; rolling: boolean }

// ゲーム画面。Room(本番)と preview(開発用)で共有する
export function Game({ state, actions, uid, roomId, anim, send, children }: {
  state: GameState; actions: Action[]; uid: string; roomId: string; anim: Anim | null;
  send: (a: { type: Action['type']; tech?: Tech }) => void; children?: ComponentChildren;
}) {
  const cur = state.players[state.current];
  const pos = anim?.pos ?? state.players.map((p) => p.position);
  const me = Math.max(0, state.players.findIndex((p) => p.uid === uid));
  const bars = '■'.repeat(state.era - 1) + '▣' + '□'.repeat(5 - state.era);
  return (
    <div class="game">
      <div class="menubar">
        <span class="era">時代 {state.era}/5 {ERAS[state.era - 1]!.place}({ERAS[state.era - 1]!.name})</span>
        <span>{bars}</span>
        <span class="sp" />
        <span>ターン {state.turn}</span>
        <span class="opt">部屋 {roomId}</span>
        <span class="opt">{state.players.length}人</span>
      </div>
      <Trend s={state} />
      <div class="main">
        <Board s={state} pos={pos} hop={anim && !anim.rolling ? anim.mover : null} me={me} />
        <Players s={state} pos={pos} />
      </div>
      <Controls
        s={state} name={cur?.name ?? ''} mine={cur?.uid === uid} busy={!!anim}
        rolling={!!anim?.rolling} die={anim ? anim.die : state.rolled} send={send}
      />
      <Log actions={actions} state={state} />
      {children}
    </div>
  );
}
