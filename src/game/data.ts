// 数値はすべて仮
import type { SquareType, Tech } from './types';

export const TECHS: Tech[] = ['web', 'mobile', 'infra', 'data', 'legacy'];

export const INITIAL_POPULARITY: Record<Tech, number> = { web: 4, mobile: 3, infra: 3, data: 2, legacy: 1 }; // 仮

export const AI_APPEAR_ERA = 3;

const P = 'project', F = 'fire', S = 'study', J = 'jobchange', E = 'event', L = 'legacy';
const [ST, AI, BR, GO] = ['start', 'ai', 'branch', 'goal'] as const;
// 1時代 = 18マス(1マス = 4か月)。盤上の進行で時代が進む。mock/map.html の全図と同じ並び
// place = 地図上のエリア名、line = エリアの色(CSS 変数名)
export const ERAS: { name: string; place: string; line: string; sq: SquareType[] }[] = [
  { name: '新卒期', place: '研修センター', line: 'job',
    sq: [ST, S, P, E, S, F, P, E, S, P, F, P, E, S, P, F, E, P] },
  { name: '若手期', place: '案件街', line: 'study',
    sq: [P, F, E, P, S, J, F, P, E, F, P, S, P, E, F, S, J, P] },
  { name: 'AI登場', place: 'AI研究所', line: 'change',
    sq: [AI, E, P, BR, S, P, F, E, P, S, F, P, E, P, F, S, E, P] },
  { name: 'ベテラン期', place: '技術の山脈', line: 'event',
    sq: [P, E, L, F, J, P, S, E, F, P, L, E, P, F, S, E, L, P] },
  { name: '終盤', place: '上がりの港', line: 'fire',
    sq: [P, E, S, F, P, E, L, P, F, E, P, S, E, F, P, L, E, GO] },
];
export const ERA_SIZE = 18;
export const BOARD: SquareType[] = ERAS.flatMap((e) => e.sq);
export const GOAL = BOARD.length - 1;

export const START = { money: 50, skill: 1, mental: 10, reputation: 1 }; // 仮
export const LEARN_COST = 30; // 仮
export const LEARN_REST = 1; // 仮
export const REST_TURNS = 2; // 仮: 休職の長さ
export const REST_MENTAL = 3; // 仮: 復帰時のメンタル
export const PROJECT_BASE = 20; // 仮: 案件の基本報酬
export const PROJECT_PER_POP = 10; // 仮: 持ち技術の人気度1あたり
export const AI_BOOST_PER_LEVEL = 0.5; // 仮: AIレベルごとの報酬倍率加算
export const AI_OVERUSE = 3; // 仮: これ以上使うとスキルが伸びない
export const LEGACY_JOB_REWARD = 80; // 仮: イベントで引く古いシステム案件
export const LEGACY_SQUARE_REWARD = 150; // 仮: レガシー案件マス(古いシステムを持っている人だけ。持っていなければ何も起きない)
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
