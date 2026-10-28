// mock/map.html の地形データと、マス・看板・目印の配置計算をそのまま移植したもの。
// 道の長さや川との交差は SVG の実測(getTotalLength / isPointInStroke)で決めるので、ブラウザ専用
import { ERA_SIZE as PER_ERA, ERAS } from '../game/data';

export const W = 1400;
export const H = 900;
export const TOTAL = ERAS.length * PER_ERA;

// 時代ごとの道(1本ずつ)。前の道の終点が次の道の始点
export const SEGS = [
  'M 90 820 C 200 850, 380 850, 400 790 S 120 740, 110 690 S 300 620, 410 640 S 330 540, 250 500',
  'M 250 500 C 170 480, 80 460, 90 410 S 390 390, 400 330 S 110 290, 100 230 S 260 110, 380 120 S 450 220, 480 260',
  'M 480 260 C 540 300, 530 420, 540 520 S 600 650, 700 640 S 860 600, 850 540 S 640 500, 650 430 S 850 400, 860 330 S 700 250, 760 220 S 900 230, 930 260',
  'M 930 260 C 990 250, 1000 160, 1000 120 S 1200 80, 1300 110 S 1320 220, 1200 220 S 1000 280, 1010 340 S 1250 330, 1310 380 S 1200 460, 1150 470',
  'M 1150 470 C 1100 500, 990 520, 1000 580 S 1240 600, 1250 660 S 1080 700, 1010 750 S 1080 850, 1180 830 S 1230 800, 1240 790',
];
// エリアの区画 [x, y, 幅, 高さ] と地面の模様、目印
export const REGIONS: { rect: Box; pat: string; marks: [string, string][]; trees: number }[] = [
  { rect: [40, 520, 420, 345], pat: 'grass', marks: [['school', '研修棟'], ['office', '本社']], trees: 9 },
  { rect: [40, 55, 420, 430], pat: 'city', marks: [['office', '客先ビル'], ['tower', '客先タワー'], ['server', 'データセンター']], trees: 0 },
  { rect: [505, 205, 395, 480], pat: 'circuit', marks: [['gpu', 'GPUクラスタ'], ['server', '研究棟']], trees: 0 },
  { rect: [945, 55, 415, 385], pat: 'slope', marks: [['mountain', 'レガシー峠'], ['mountain', 'クラウド峰']], trees: 4 },
  { rect: [945, 475, 415, 390], pat: 'waves', marks: [['lighthouse', '引退の灯台'], ['ship', '定年丸']], trees: 0 },
];
export const RIVERS = [
  'M 470 0 C 490 120, 455 220, 482 330 S 470 520, 488 610 S 470 800, 482 900',
  'M 928 0 C 915 150, 935 300, 922 470 S 930 700, 905 900',
];
export const SEA = 'M 1400 600 C 1340 660, 1370 760, 1300 820 S 1265 880, 1250 900 L 1400 900 Z';

// ---- ドット絵 ----
export const PAL: Record<string, string> = {
  g: 'var(--t-green)', t: '#8a5a2b', k: 'var(--muted)', w: 'var(--panel-2)', y: 'var(--title)', d: 'var(--drop)',
  r: 'var(--t-red)', s: '#f4f6fb', m: 'var(--t-magenta)', c: 'var(--t-cyan)', i: 'var(--ink)', o: '#7b8494', b: 'var(--frame)',
};
export const SPRITES: Record<string, string[]> = {
  tree: ['..g..', '.ggg.', 'ggggg', '.ggg.', 'ggggg', '..t..', '..t..'],
  office: ['kkkkkkk', 'kwkwkyk', 'kkkkkkk', 'kykwkwk', 'kkkkkkk', 'kwkwkyk', 'kkkkkkk', 'kwkykwk', 'kkkkkkk', 'kkkddkk'],
  tower: ['...i...', '..kkk..', '..kyk..', '..kkk..', '.kwkwk.', '.kkkkk.', '.kykwk.', '.kkkkk.', '.kwkyk.', '.kkkkk.', '.kwkwk.', '.kkkkk.', '.kkddk.'],
  school: ['....r....', '....rr...', '....i....', 'kkkkkkkkk', 'kwkwkwkwk', 'kkkkkkkkk', 'kwkwddkwk', 'kkkkddkkk'],
  server: ['ooooooo', 'odgdddo', 'ooooooo', 'oddrddo', 'ooooooo', 'odgdcdo', 'ooooooo', 'o.....o'],
  gpu: ['.k.k.k.k.', 'kkkkkkkkk', '.kmmmmmk.', 'kkm...mkk', '.km.c.mk.', 'kkm...mkk', '.kmmmmmk.', 'kkkkkkkkk', '.k.k.k.k.'],
  mountain: ['......s......', '.....sss.....', '....sskkk....', '...kkkkkkk...', '..kkkkkkkkk..', '.kkkkkkkkkkk.', 'kkkkkkkkkkkkk'],
  lighthouse: ['y...y...y', '.y..y..y.', '...yyy...', '...iii...', '...rrr...', '...sss...', '...rrr...', '...sss...', '...rrr...', '...sss...', '..kkkkk..', '.kkkkkkk.'],
  ship: ['.....i.....', '....ii.....', '...iii.....', '..iiii.....', 'kkkkkkkkkkk', '.krkkkkkkk.', '..kkkkkkk..'],
};

export type Box = [number, number, number, number];
const spriteBox = (name: string, x: number, y: number, s: number): Box => {
  const rows = SPRITES[name]!;
  return [x - rows[0]!.length * s / 2, y - rows.length * s, rows[0]!.length * s, rows.length * s];
};
const distToBox = ([px, py]: [number, number], [bx, by, bw, bh]: Box) =>
  Math.hypot(Math.max(bx - px, 0, px - bx - bw), Math.max(by - py, 0, py - by - bh));
const boxesOverlap = (a: Box, b: Box, pad = 0) =>
  a[0] < b[0] + b[2] + pad && b[0] < a[0] + a[2] + pad && a[1] < b[1] + b[3] + pad && b[1] < a[1] + a[3] + pad;

export interface Geo {
  pts: [number, number][];
  bridges: string[];
  gates: { x: number; y: number; ang: number; plate?: { box: Box; cx: number; text: string } }[];
  signs: { x: number; box: Box; pole: [number, number]; label: string }[];
  labels: Box[]; // エリア名の位置(時代ごと)
  landmarks: { name: string; nm: string; cx: number; cy: number; s: number }[];
  trees: { cx: number; cy: number }[];
}

export function computeGeo(): Geo {
  const NS = 'http://www.w3.org/2000/svg';
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // 実測用の見えない SVG
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;visibility:hidden');
  const mk = (d: string, extra: Record<string, string> = {}) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    for (const k in extra) p.setAttribute(k, extra[k]!);
    svg.appendChild(p);
    return p;
  };
  const rivers = RIVERS.map((d) => mk(d, { fill: 'none', stroke: '#000', 'stroke-width': '30' }));
  const dashes = SEGS.map((d) => mk(d, { fill: 'none' }));
  document.body.appendChild(svg);

  const pts: [number, number][] = [];
  dashes.forEach((path, e) => {
    const len = path.getTotalLength();
    for (let j = 0; j < PER_ERA; j++) {
      const p = path.getPointAtLength(len * (j + 0.5) / PER_ERA);
      pts[e * PER_ERA + j] = [p.x, p.y];
    }
  });

  // 橋: 道が川の上を通るところ
  const bridges: string[] = [];
  dashes.forEach((path) => {
    const len = path.getTotalLength();
    let run: DOMPoint[] = [];
    const flush = () => {
      if (run.length > 1) bridges.push('M' + run.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L'));
      run = [];
    };
    for (let s = 0; s <= len; s += 3) {
      const p = path.getPointAtLength(s);
      const pt = new DOMPoint(p.x, p.y);
      if (rivers.some((r) => r.isPointInStroke(pt))) run.push(p); else flush();
    }
    flush();
  });

  // 道の上の「混んでいる点」。名前や飾りはここを避ける
  const busy: [number, number][] = [];
  dashes.forEach((path) => {
    const len = path.getTotalLength();
    for (let s = 0; s <= len; s += 14) { const p = path.getPointAtLength(s); busy.push([p.x, p.y]); }
  });
  const taken: Box[] = [];
  const gapAt = (box: Box) => Math.min(...busy.map((p) => distToBox(p, box)));
  const free = (box: Box, minGap: number, pad = 8) => gapAt(box) > minGap && taken.every((t) => !boxesOverlap(t, box, pad));

  // 関所
  const gates: Geo['gates'] = [];
  for (let e = 1; e < ERAS.length; e++) {
    const path = dashes[e]!;
    const p = path.getPointAtLength(1), q = path.getPointAtLength(12);
    const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
    const g: Geo['gates'][number] = { x: p.x, y: p.y, ang };
    const lw = 66;
    const spots = [[0, -62], [0, 38], [-62, -40], [62, -40], [-62, 18], [62, 18], [0, -90], [0, 66]];
    for (const [dx, dy] of spots) {
      const box: Box = [p.x + dx! - lw / 2, p.y + dy!, lw, 22];
      if (!free(box, 28, 6)) continue;
      taken.push(box);
      g.plate = { box, cx: p.x + dx!, text: `時代${e + 1}へ` };
      break;
    }
    gates.push(g);
  }

  // 年数の立て札: 15マス(5年)ごと
  const signs: Geo['signs'] = [];
  for (let i = 14; i < TOTAL - 1; i += 15) {
    const [x, y] = pts[i]!;
    const cands = [[40, -54], [-40, -54], [40, 26], [-40, 26], [0, -76], [0, 44], [64, -14], [-64, -14]];
    for (const [dx, dy] of cands) {
      const box: Box = [x + dx! - 28, y + dy!, 56, 20];
      if (free(box, 28, 4)) {
        taken.push(box);
        signs.push({ x: x + dx!, box, pole: [y + dy! + 20, y + dy! + 34], label: `${(i + 1) / 3}年目` });
        break;
      }
    }
  }

  taken.push([535, 40, 335, 135]); // 題名
  taken.push([565, 715, 300, 160]); // 凡例

  // エリア名
  const labels: Box[] = [];
  ERAS.forEach((era, e) => {
    const [x, y, w, h] = REGIONS[e]!.rect;
    const sub = `時代${e + 1} ${era.name}`;
    const lw = era.place.length * 25 + sub.length * 13 + 20, lh = 30;
    let best: Box | null = null, bestGap = -1;
    for (let by = y + 8; by <= y + h - lh - 8; by += 6)
      for (let bx = x + 10; bx <= x + w - lw - 10; bx += 6) {
        const box: Box = [bx, by, lw, lh];
        if (!taken.every((t) => !boxesOverlap(t, box, 6))) continue;
        const g = gapAt(box);
        if (g > bestGap) { bestGap = g; best = box; }
      }
    taken.push(best!);
    labels.push(best!);
  });

  // 目印のドット絵と木
  const landmarks: Geo['landmarks'] = [];
  const trees: Geo['trees'] = [];
  REGIONS.forEach(({ rect: [x, y, w, h], marks, trees: nTrees }) => {
    marks.forEach(([name, nm]) => {
      const s = name === 'mountain' ? 6 : 5;
      let best: [number, number, Box] | null = null, bestGap = -1;
      for (let cy = y + 30; cy <= y + h - 30; cy += 8)
        for (let cx = x + 40; cx <= x + w - 40; cx += 8) {
          const box = spriteBox(name, cx, cy, s);
          const tw = Math.max(box[2] + 12, nm.length * 12 + 10);
          const full: Box = [cx - tw / 2, box[1] - 4, tw, box[3] + 22];
          if (full[0] < x + 6 || full[1] < y + 6 || full[0] + full[2] > x + w - 6 || full[1] + full[3] > y + h - 6) continue;
          if (!taken.every((t) => !boxesOverlap(t, full, 10))) continue;
          const g = gapAt(full);
          if (g > bestGap) { bestGap = g; best = [cx, cy, full]; }
        }
      if (!best || bestGap < 18) return;
      const [cx, cy, full] = best;
      taken.push(full);
      landmarks.push({ name, nm, cx, cy, s });
    });
    for (let k = 0, n = 0; k < 200 && n < nTrees; k++) {
      const cx = x + 20 + rand() * (w - 40), cy = y + 40 + rand() * (h - 50);
      const box = spriteBox('tree', cx, cy, 4);
      if (box[1] < y + 8 || box[0] + box[2] > x + w - 8) continue;
      if (free(box, 22, 6)) { taken.push(box); trees.push({ cx, cy }); n++; }
    }
  });

  svg.remove();
  return { pts, bridges, gates, signs, labels, landmarks, trees };
}
