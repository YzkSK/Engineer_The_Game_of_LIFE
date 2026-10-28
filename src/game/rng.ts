// mulberry32。状態(number)を受け取り [値(0以上1未満), 次の状態] を返す純関数
export function next(s: number): [number, number] {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

// 0..n-1 の整数
export function randInt(s: number, n: number): [number, number] {
  const [v, s2] = next(s);
  return [Math.floor(v * n), s2];
}
