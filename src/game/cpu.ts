import type { Action, GameState } from './types';

// 振ったら終わるだけの単純なCPU
export function cpuAction(s: GameState): Action {
  const by = s.players[s.current]?.uid ?? '';
  return s.rolled === null ? { type: 'roll', by } : { type: 'endTurn', by };
}
