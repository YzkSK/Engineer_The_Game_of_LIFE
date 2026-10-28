import type { Player } from './types';

// 設計書§8: お金10万円ごと1点 / スキル2点 / 評判2点 / メンタル残り分 / ボーナス
export function score(p: Player): number {
  return Math.floor(p.money / 10) + p.skill * 2 + p.reputation * 2 + Math.max(0, p.mental) + p.bonus;
}
