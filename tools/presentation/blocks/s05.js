// ============ 05 · Disruption experiment ============
{
  const s = light('The disruption experiment', 'STRESS CONTROLS', 5);
  const ih = 5.2, iw = ih * 2680 / 2406, ix = 0.6, iy = 1.48;
  card(s, ix - 0.05, iy - 0.05, iw + 0.1, ih + 0.1, { line: LINE2 });
  s.addImage({ path: S('pg-05-stress-tall'), x: ix, y: iy, w: iw, h: ih, altText: 'SAYR Stress Controls with Staff unavailability selected', objectName: 'S5_shot' });
  const rx = 6.75, rw = 5.98;
  txt(s, 'FOUR IMPLEMENTED SCENARIOS · ONE DAY, 08:00–16:00', { x: rx, y: 1.5, w: rw, h: 0.22, fontFace: MONO, fontSize: 9, color: COPPER, charSpacing: 1.2 });
  const ax0 = 9.0, ax1 = 12.6, X = (t) => ax0 + ((t - 480) / 480) * (ax1 - ax0);
  [8, 10, 12, 14, 16].forEach((h) => { line(s, X(h * 60), 1.85, X(h * 60), 3.5, { color: LINE2, w: 0.5 }); txt(s, `${h}:00`, { x: X(h * 60) - 0.3, y: 3.52, w: 0.6, h: 0.16, fontFace: MONO, fontSize: 7.5, color: MUT, align: 'center' }); });
  const rows = [['Staff unavailability', 'clinician out 10:30–13:30', 630, 810, COPPER, true], ['Walk-in surge', '8 patients around 11:00', 660, 668, NAVY2, false], ['Laboratory slowdown', '+50% from 12:00', 720, 960, MUT, false], ['Room closure', 'from 13:00 to end', 780, 960, MUT, false]];
  rows.forEach(([a, b, t0, t1, c, big], i) => {
    const y = 1.92 + i * 0.4;
    txt(s, a, { x: rx, y: y + 0.02, w: 2.2, h: 0.3, fontFace: HEAD, fontSize: big ? 14 : 12, bold: big, color: big ? COPPER : INK2 });
    rect(s, X(t0), y + (big ? 0.0 : 0.06), Math.max(0.1, X(t1) - X(t0)), big ? 0.32 : 0.2, { fill: c, tr: big ? 0 : 20, r: 0.03, name: `S5_bar${i}` });
    if (big) txt(s, 'FEATURED · 10:30–13:30', { x: X(t0) + 0.08, y: y + 0.07, w: 2, h: 0.18, fontFace: MONO, fontSize: 7.5, bold: true, color: 'FFFFFF', charSpacing: 1 });
    else txt(s, b, { x: X(t1 > 900 ? t0 : t1) + (t1 > 900 ? 0.08 : 0.15), y: y + 0.07, w: 2.4, h: 0.2, fontSize: 8.5, color: t1 > 900 ? 'FFFFFF' : MUT });
  });
  const hdr = (t, al = 'right') => ({ text: t, options: { bold: true, fontFace: MONO, fontSize: 8.5, color: MUT, align: al, fill: { color: PAPER3 }, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: LINE2 }, { type: 'none' }] } });
  const c = (t, o = {}) => ({ text: t, options: { fontSize: 12, color: INK, align: 'right', fontFace: BODY, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: LINE }, { type: 'none' }], ...o } });
  s.addTable(
    [
      [hdr('SAME 60 PATIENTS · SEED 7', 'left'), hdr('NORMAL'), hdr('STAFF OUT')],
      [c('Total waiting (min)', { align: 'left' }), c('1,056'), c('1,946', { color: COPPER, bold: true })],
      [c('Median wait (min)', { align: 'left' }), c('17'), c('28', { color: COPPER, bold: true })],
      [c('90th-percentile wait (min)', { align: 'left' }), c('42'), c('75', { color: COPPER, bold: true })],
      [c('Staff overtime (min)', { align: 'left' }), c('0'), c('24', { color: COPPER, bold: true })],
      [c('Journeys done by 16:00', { align: 'left' }), c('60'), c('59', { color: COPPER, bold: true })],
    ],
    { x: rx, y: 4.0, w: rw, colW: [3.2, 1.3, 1.48], rowH: 0.36, fontFace: BODY, valign: 'middle', margin: [0, 0.08, 0, 0.08], objectName: 'S5_table' },
  );
  txt(s, 'We can investigate operational pressure without experimenting on real patients.', { x: rx, y: 6.2, w: rw, h: 0.5, fontFace: HEAD, fontSize: 16, italic: true, color: INK });
  source(s, 'Source: SAYR Stress Controls, "Disruption impact · same patients", full replays of the same day. The other three scenarios are implemented but are not quantified in this deck.');
}

