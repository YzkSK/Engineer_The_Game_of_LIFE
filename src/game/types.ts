export type Tech = 'web' | 'mobile' | 'infra' | 'data' | 'legacy';
export type SquareType = 'project' | 'fire' | 'study' | 'jobchange' | 'event';

export interface Player {
  uid: string;
  name: string;
  isCpu: boolean;
  money: number; // 万円
  skill: number;
  mental: number;
  reputation: number;
  techs: Tech[];
  position: number;
  restTurns: number;
  aiCards: number;
  aiActive: boolean; // 次の案件マスでAIカードを使う
  aiUsed: number; // AIカード使用回数(使いすぎるとスキルが伸びない)
  bonus: number; // 満足度ボーナス
}

export interface GameState {
  status: 'lobby' | 'playing' | 'finished';
  players: Player[];
  current: number; // 手番プレイヤーの index
  era: number; // 1..5
  eraTurn: number; // 現在の時代で経過したラウンド数
  popularity: Record<Tech, number>; // 1..5
  aiLevel: number; // 0 = 未登場
  rng: number;
  rolled: number | null; // 今の手番で振った目(振っていなければ null)
}

export interface PlayerInit {
  uid: string;
  name: string;
  isCpu: boolean;
}

export type Action = { by: string } & (
  | { type: 'start'; players: PlayerInit[]; seed: number }
  | { type: 'roll' }
  | { type: 'learnTech'; tech: Tech }
  | { type: 'useAiCard' }
  | { type: 'endTurn' }
);
