import type { Player } from './types';

// 設計書§8: お金10万円ごと1点 / スキル2点 / 評判2点 / メンタル残り分 / ボーナス
// 内訳 [お金, スキル, 評判, メンタル, ボーナス]
export const scoreParts = (p: Player): number[] =>
  [Math.floor(p.money / 10), p.skill * 2, p.reputation * 2, Math.max(0, p.mental), p.bonus];

export const score = (p: Player): number => scoreParts(p).reduce((a, b) => a + b, 0);
