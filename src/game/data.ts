// 数値はすべて仮
import type { SquareType, Tech } from './types';

export const TECHS: Tech[] = ['web', 'mobile', 'infra', 'data', 'legacy'];

export const INITIAL_POPULARITY: Record<Tech, number> = { web: 4, mobile: 3, infra: 3, data: 2, legacy: 1 }; // 仮

export const ERA_TURNS = [4, 4, 4, 4, 4]; // 仮: 時代ごとのラウンド数

export const AI_APPEAR_ERA = 3;

const P = 'project', F = 'fire', S = 'study', J = 'jobchange', E = 'event';
export const BOARD: SquareType[] = [
  P, P, S, E, F, P, J, S, P, E,
  F, P, S, P, E, J, P, F, S, P,
  E, P, F, S, J, P, E, P, F, S,
]; // 仮: 30マス

export const START = { money: 50, skill: 1, mental: 10, reputation: 1 }; // 仮
export const LEARN_COST = 30; // 仮
export const LEARN_REST = 1; // 仮
export const REST_TURNS = 2; // 仮: 休職の長さ
export const REST_MENTAL = 3; // 仮: 復帰時のメンタル
export const PROJECT_BASE = 20; // 仮: 案件の基本報酬
export const PROJECT_PER_POP = 10; // 仮: 持ち技術の人気度1あたり
export const AI_BOOST_PER_LEVEL = 0.5; // 仮: AIレベルごとの報酬倍率加算
export const AI_OVERUSE = 3; // 仮: これ以上使うとスキルが伸びない
export const LEGACY_JOB_REWARD = 80; // 仮: 古いシステム案件
export const BONUS_FIRE = 2; // 仮: 炎上を乗り切ったときの評判

type Delta = Partial<Record<Tech, number>>;
export interface Card { name: string; delta: Delta }

export const TREND_CARDS: Card[] = [
  { name: 'Webブーム', delta: { web: 1, legacy: -1 } },
  { name: 'スマホ全盛', delta: { mobile: 1 } },
  { name: 'クラウド移行', delta: { infra: 1, legacy: -1 } },
  { name: 'データの時代', delta: { data: 2 } },
  { name: 'レガシー再評価', delta: { legacy: 2, web: -1 } },
]; // 仮

export const AI_CARDS: Card[] = [
  { name: 'コード生成が普及', delta: { web: -1, mobile: -1, data: 1 } },
  { name: 'AIが運用を代替', delta: { infra: -1, web: -1 } },
  { name: 'AI活用設計が重宝', delta: { data: 2, infra: 1, web: -1 } },
]; // 仮
