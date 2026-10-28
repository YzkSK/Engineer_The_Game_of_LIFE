export type Tech = 'web' | 'mobile' | 'infra' | 'data' | 'legacy';
export type SquareType = 'project' | 'fire' | 'study' | 'jobchange' | 'event' | 'legacy' | 'start' | 'ai' | 'branch' | 'goal';

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
  retired: boolean; // ゴールに着いた
}

export interface GameState {
  status: 'lobby' | 'playing' | 'finished';
  players: Player[];
  current: number; // 手番プレイヤーの index
  era: number; // 1..5。最も進んでいるプレイヤーの位置で決まる
  turn: number; // 全体のラウンド数(1始まり。表示用)
  popularity: Record<Tech, number>; // 1..5
  prevPopularity: Record<Tech, number>; // 直近の時代替わりの前の人気度(増減表示用)
  aiLevel: number; // 0 = 未登場
  rng: number;
  rolled: number | null; // 今の手番で振った目(振っていなければ null)
  lastCards: { trend: number; ai: number | null } | null; // 直近の時代替わりで引いたカード(TREND_CARDS / AI_CARDS の index)。演出用
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
