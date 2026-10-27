// one-off: splice rewritten slide blocks and apply small fixes to deck.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const p = new URL('./deck.mjs', import.meta.url);
let t = readFileSync(p, 'utf8');
const blk = (n) => readFileSync(new URL(`./blocks/${n}.js`, import.meta.url), 'utf8');
const splice = (from, to, body) => {
  const a = t.indexOf(from), b = t.indexOf(to);
  if (a < 0 || b < 0 || b < a) throw new Error('marker missing: ' + from);
  t = t.slice(0, a) + body + t.slice(b);
};
splice('// ============ 05 · Disruption experiment', '// ============ 06 · Ripple', blk('s05'));
splice('// ============ 07 · Reflow (centerpiece)', '// ============ 08 · Human remains', blk('s07'));
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing: ' + a.slice(0, 60)); t = t.replace(a, b); };
// S9
rep("txt(s, 'Total patient waiting minutes · axis starts at 870 · each bar is its own replay, so the bars sum exactly', { x: 0.9, y: 2.62, w: 5.7, h: 0.18, fontFace: MONO, fontSize: 7.5, color: MUT });", "txt(s, 'Total patient waiting minutes · axis starts at 870 · each bar is a separate replay', { x: 0.9, y: 2.62, w: 5.7, h: 0.18, fontFace: MONO, fontSize: 7.5, color: MUT });");
rep('[870, 1165, 1465, 1760, 2060]', '[870, 1168, 1465, 1763, 2060]');
rep("Same patients, arrivals and realised durations in all three runs'", "Same patients, arrivals and realised durations in all three runs; the bars add up exactly'");
// S11
rep("line(s, 0.9, 2.28, 12.45, 2.28, { color: LINE2, w: 2 });", "line(s, 0.9, 2.28, 12.45, 2.28, { color: LINE2, w: 2 });\n  txt(s, 'PROTOTYPE TODAY  →  VALIDATION  →  SUPERVISED RESEARCH', { x: 0.6, y: 1.5, w: 8, h: 0.2, fontFace: MONO, fontSize: 8.5, color: MUT, charSpacing: 1.5 });");
rep("txt(s, k, { x: x + 0.55, y: 2.17, w: 1.5, h: 0.22,", "txt(s, k, { x: x + 0.5, y: 1.82, w: 1.5, h: 0.22,");
rep("card(s, x, 2.7, w, 2.55, { line: done", "card(s, x, 2.7, w, 2.3, { line: done");
rep("if (done) txt(s, 'WHERE WE ARE', { x: x + 0.15, y: 5.0,", "if (done) txt(s, 'WHERE WE ARE', { x: x + 0.15, y: 4.72,");
rep("card(s, 0.6, 5.5, 7.6, 1.15);\n  txt(s, 'AL DHAFRA CONTEXT', { x: 0.8, y: 5.58,", "card(s, 0.6, 5.3, 7.6, 1.3);\n  txt(s, 'AL DHAFRA CONTEXT', { x: 0.8, y: 5.4,");
rep("{ x: 0.8, y: 5.82, w: 7.2, h: 0.8, fontSize: 10.5, color: INK2 }", "{ x: 0.8, y: 5.68, w: 7.2, h: 0.85, fontSize: 11.5, color: INK2 }");
rep("rect(s, 8.4, 5.5, 4.33, 1.15, { fill: INK, r: 0.07 });\n  txt(s, 'The next step is validation, not deployment by assumption.', { x: 8.6, y: 5.55, w: 3.95, h: 1.05,", "rect(s, 8.4, 5.3, 4.33, 1.3, { fill: INK, r: 0.07 });\n  txt(s, 'The next step is validation, not deployment by assumption.', { x: 8.6, y: 5.35, w: 3.95, h: 1.2,");
// S12
rep("{ x: 0.7, y: 1.1, w: 8.2, h: 1.9, fontFace: HEAD, fontSize: 28, italic: true, color: PAPER, valign: 'top' }", "{ x: 0.7, y: 1.15, w: 8.6, h: 1.9, fontFace: HEAD, fontSize: 24, italic: true, color: PAPER, valign: 'top' }");
// S13: journey timestamps
rep(`  const seg = [['ready', 0, 0.3, null], ['WAITING', 0.3, 2.6, COPPER], ['service', 2.9, 2.2, TEAL], ['transfer', 5.1, 0.8, MUT2]];
  seg.forEach(([a, x, w, c]) => {
    if (c) rect(s, 0.9 + x, 4.35, w, 0.45, { fill: c, round: false });
    txt(s, a, { x: 0.9 + x, y: 4.85, w: Math.max(w, 0.8), h: 0.2, fontFace: MONO, fontSize: 8.5, color: INK2 });
  });
  txt(s, 'wait = start of service − ready', { x: 0.9 + 0.3, y: 4.43, w: 2.6, h: 0.3, fontFace: MONO, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center' });`,
`  const seg = [['waiting', 0, 2.6, COPPER], ['service', 2.6, 2.2, TEAL], ['transfer', 4.8, 0.9, MUT2]];
  seg.forEach(([a, x, w, c]) => {
    rect(s, 0.9 + x, 4.5, w, 0.42, { fill: c, round: false });
    txt(s, a, { x: 0.9 + x, y: 4.95, w, h: 0.2, fontFace: MONO, fontSize: 8.5, color: INK2, align: 'center' });
  });
  [['ready', 0], ['service starts', 2.6], ['service ends', 4.8], ['next stage ready', 5.7]].forEach(([a, x], i) => {
    line(s, 0.9 + x, 4.38, 0.9 + x, 4.5, { color: MUT, w: 1 });
    txt(s, a, { x: 0.9 + x - (i === 3 ? 1.0 : 0.5), y: 4.2, w: i === 3 ? 1.4 : 1.0, h: 0.16, fontFace: MONO, fontSize: 7.5, color: MUT, align: i === 3 ? 'right' : 'center' });
  });
  txt(s, 'wait = start of service − ready', { x: 0.9, y: 4.56, w: 2.6, h: 0.3, fontFace: MONO, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center' });`);
// S14 geometry
rep("card(s, x, 1.45, 3.95, 2.35);", "card(s, x, 1.45, 3.95, 1.95);");
rep("txt(s, b, { x: x + 0.18, y: 1.85, w: 3.62, h: 1.9, fontSize: 9.5, color: INK2 });", "txt(s, b, { x: x + 0.18, y: 1.8, w: 3.62, h: 1.55, fontSize: 9.5, color: INK2 });");
rep("const dy = 4.0;", "const dy = 3.6;");
rep("const lh = 0.8;", "const lh = 0.72;");
rep("const laneY = { 'GP-1': dy + 0.3, 'GP-2': dy + 1.15, 'GP-3': dy + 2.0 };", "const laneY = { 'GP-1': dy + 0.3, 'GP-2': dy + 1.07, 'GP-3': dy + 1.84 };");
rep("line(s, TX(hm(t)), dy + 0.3, TX(hm(t)), dy + 2.8,", "line(s, TX(hm(t)), dy + 0.3, TX(hm(t)), dy + 2.56,");
rep("y: dy + 2.82, w: 0.6, h: 0.16", "y: dy + 2.58, w: 0.6, h: 0.16");
rep("const ty = (lane) => laneY[lane] + 0.1 + row * 0.36;", "const ty = (lane) => laneY[lane] + 0.07 + row * 0.33;");
rep("const cw = 0.62, ch = 0.3;", "const cw = 0.62, ch = 0.28;");
rep("y: laneY['GP-2'] + 0.28, w: 2.2", "y: laneY['GP-2'] + 0.26, w: 2.2");
rep("laneY['GP-2'] + 0.05, TX(hm('13:30')) - TX(hm('10:50')), lh - 0.1,", "laneY['GP-2'] + 0.05, TX(hm('13:30')) - TX(hm('10:50')), lh - 0.1,");
writeFileSync(p, t);
console.log('patched');
