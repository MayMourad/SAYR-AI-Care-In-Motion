// ============ 07 · Reflow (centerpiece) ============
{
  const s = light('Reflow Studio: from disruption to decision', 'WOW 2 · THE SYSTEM REFLOWS', 7);
  const iw = 5.55, ih = iw * 1082 / 1876, y0 = 1.42;
  const shots = [['c-reflow-before', 0.6, 'CURRENT PLAN', '1,698 planned waiting min', '43 appointments still expected to wait 15 min or more', MUT], ['c-reflow-after', 7.18, 'PROPOSED PLAN', '1,619 planned waiting min  (−80)', '42 changes: 6 reassigned, 36 re-sequenced · 9 of 9 constraints kept', TEAL]];
  shots.forEach(([f, x, a, b, c, col], i) => {
    card(s, x - 0.04, y0 - 0.04, iw + 0.08, ih + 0.08, { line: LINE2 });
    s.addImage({ path: S(f), x, y: y0, w: iw, h: ih, altText: `${a} in Reflow Studio`, objectName: `S7_shot${i}` });
    txt(s, a, { x, y: y0 + ih + 0.13, w: 3, h: 0.2, fontFace: MONO, fontSize: 9, bold: true, color: col, charSpacing: 1.5 });
    txt(s, b, { x, y: y0 + ih + 0.33, w: iw, h: 0.36, fontFace: HEAD, fontSize: 17, color: i ? TEAL : INK });
    txt(s, c, { x, y: y0 + ih + 0.7, w: iw, h: 0.22, fontSize: 9.5, color: INK2 });
  });
  s.addShape(OVAL, { x: 6.465, y: y0 + ih / 2 - 0.2, w: 0.4, h: 0.4, fill: { color: COPPER }, line: { color: PAPER, width: 2 } });
  txt(s, '→', { x: 6.465, y: y0 + ih / 2 - 0.2, w: 0.4, h: 0.4, fontFace: BODY, fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  // numbered callouts on the proposed plan: fractions of the crop (x, y)
  [[1, 0.413, 0.628], [2, 0.32, 0.55], [3, 0.558, 0.506], [4, 0.28, 0.463]].forEach(([n, fx, fy]) => bubble(s, n, 7.18 + fx * iw, y0 + fy * ih, { name: `S7_c${n}` }));
  txt(s, [{ text: '1', options: { color: COPPER, bold: true } }, { text: ' reassignment   ', options: {} }, { text: '2', options: { color: COPPER, bold: true } }, { text: ' outage constraint   ', options: {} }, { text: '3', options: { color: COPPER, bold: true } }, { text: ' re-sequenced (wait change)   ', options: {} }, { text: '4', options: { color: COPPER, bold: true } }, { text: ' remaining delay', options: {} }], { x: 7.18, y: y0 + ih + 0.95, w: iw, h: 0.2, fontSize: 9, color: INK2 });
  // one genuine appointment movement, as an editable animation target
  const by = 5.82;
  card(s, 0.6, by, 8.0, 1.0);
  txt(s, 'ONE REAL MOVE · J-036 ON GP-3 · START 12:18 → 11:57 · −45 MIN WAIT', { x: 0.8, y: by + 0.06, w: 7.6, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  const tx0 = 1.5, tx1 = 8.2, TX = (t) => tx0 + ((t - hm('11:45')) / 45) * (tx1 - tx0);
  line(s, tx0, by + 0.77, tx1, by + 0.77, { color: LINE2, w: 1 });
  ['11:45', '12:00', '12:15', '12:30'].forEach((t) => { line(s, TX(hm(t)), by + 0.73, TX(hm(t)), by + 0.81, { color: MUT2, w: 1 }); txt(s, t, { x: TX(hm(t)) - 0.3, y: by + 0.82, w: 0.6, h: 0.15, fontFace: MONO, fontSize: 7.5, color: MUT, align: 'center' }); });
  txt(s, 'GP-3', { x: 0.8, y: by + 0.45, w: 0.6, h: 0.2, fontFace: MONO, fontSize: 8.5, bold: true, color: INK });
  txt(s, '11:57', { x: TX(hm('11:57')) - 0.4, y: by + 0.28, w: 0.8, h: 0.14, fontFace: MONO, fontSize: 8, color: TEAL, align: 'center' });
  s.addShape(R, { x: TX(hm('11:57')) - 0.4, y: by + 0.42, w: 0.8, h: 0.28, rectRadius: 0.04, fill: { type: 'none' }, line: { color: TEAL, width: 1.25, dashType: 'dash' }, objectName: 'S7_target' });
  txt(s, '12:18', { x: TX(hm('12:18')) - 0.4, y: by + 0.28, w: 0.8, h: 0.14, fontFace: MONO, fontSize: 8, color: MUT, align: 'center' });
  s.addShape(R, { x: TX(hm('12:18')) - 0.4, y: by + 0.42, w: 0.8, h: 0.28, rectRadius: 0.04, fill: { color: NAVY }, line: { color: NAVY, width: 1 }, objectName: 'S7_chip' });
  txt(s, 'J-036', { x: TX(hm('12:18')) - 0.4, y: by + 0.42, w: 0.8, h: 0.28, fontFace: MONO, fontSize: 9.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', objectName: 'S7_chiptext' });
  // decision controls (replica of the app's buttons)
  card(s, 8.8, by, 3.93, 1.0);
  txt(s, 'DECISION CONTROLS · NOTHING APPLIES UNTIL A PERSON CHOOSES', { x: 8.95, y: by + 0.06, w: 3.7, h: 0.2, fontFace: MONO, fontSize: 7, color: COPPER });
  rect(s, 8.95, by + 0.32, 2.1, 0.34, { fill: NAVY, r: 0.05 });
  txt(s, 'Accept in the simulation', { x: 8.95, y: by + 0.32, w: 2.1, h: 0.34, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  rect(s, 11.15, by + 0.32, 0.8, 0.34, { fill: PAPER2, line: LINE2, r: 0.05 });
  txt(s, 'Reject', { x: 11.15, y: by + 0.32, w: 0.8, h: 0.34, fontSize: 10, color: INK, align: 'center', valign: 'middle' });
  txt(s, 'Heuristic search: no guarantee of a global optimum.', { x: 8.95, y: by + 0.72, w: 3.7, h: 0.22, fontSize: 9, italic: true, color: INK2 });
  source(s, 'Source: SAYR Reflow Studio and Action Desk, seed 7, staff scenario, plan captured at 10:50, objective "Fewest waiting minutes". Planned values use booked lengths; the Ledger measures the realised result.', 6.87);
}

