export interface Reference {
  name: string;
  url: string;
  creator: string;
  informed: string;
  reuse: 'Inspiration only';
  license: string;
}

export const TEAM = [
  { name: 'Lujain Ahmed Mourad', grade: '8D' },
  { name: 'Yosr Amgad', grade: '8D' },
  { name: 'Precious Fuentes', grade: '8D' },
  { name: 'Maryam Ammara Jelita', grade: '8D' },
  { name: 'Eleen Amr', grade: '8D' },
  { name: 'Shaden Ahmed Mourad', grade: '6D' },
];
export const SCHOOL = 'ADNOC School – Madinat Zayed';

export const REFERENCES: Reference[] = [
  {
    name: 'Spline Hana',
    url: 'https://spline.design/hana',
    creator: 'Spline',
    informed: 'State-and-transition thinking behind Reflow',
    reuse: 'Inspiration only',
    license: 'Product page; no asset used',
  },
  {
    name: 'Charts with interactive hover animation',
    url: 'https://community.spline.design/file/322b331b-3950-46e4-a049-8a61bcdb710e',
    creator: '@marinach',
    informed: 'Hover behaviour of the Minutes Ledger waterfall',
    reuse: 'Inspiration only',
    license: 'CC BY 4.0 (credited here; nothing reused)',
  },
  {
    name: 'Flow',
    url: 'https://community.spline.design/file/ff4fcef4-b6ab-406f-9359-d639509f2d99',
    creator: '@vladkolokolnikov',
    informed: 'Connected-path composition of journey lines',
    reuse: 'Inspiration only',
    license: 'CC BY 4.0 (credited here; nothing reused)',
  },
  {
    name: 'Auto Layout 3D List',
    url: 'https://app.spline.design/ui/a3144449-bf5c-4189-a3f1-dda35c699bc4',
    creator: 'Not stated on the page',
    informed: 'Expandable, stacked Action Desk cards (flat 2D here)',
    reuse: 'Inspiration only',
    license: 'Not stated on the page',
  },
  {
    name: 'Animated Icons (Spline UI)',
    url: 'https://app.spline.design/ui/9389d529-f05b-4aa7-9360-11175d1b4e72',
    creator: 'Not stated on the page',
    informed: 'Lane status indicators (idle, busy, down)',
    reuse: 'Inspiration only',
    license: 'Not stated on the page',
  },
  {
    name: 'Thumbnail Grid Transition',
    url: 'https://recent.design/i/fgweqvk-thumbnail-grid-transition',
    creator: 'Corentin Bernadou',
    informed: 'Staggered choreography of the Reflow move',
    reuse: 'Inspiration only',
    license: 'None stated',
  },
  {
    name: 'Spacing Tips',
    url: 'https://recent.design/i/qbsvs1j-spacing-visualization-dashboard',
    creator: 'Michael Filipiuk',
    informed: 'Spacing scale and panel composition',
    reuse: 'Inspiration only',
    license: 'None stated',
  },
  {
    name: 'iOS Gesture Studies',
    url: 'https://recent.design/i/qsi4mth-x-com',
    creator: 'Juliette',
    informed: 'Drag, settle and snap-back on the Resource Board',
    reuse: 'Inspiration only',
    license: 'None stated',
  },
  {
    name: 'Krea Image Generation — progressive loading state',
    url: 'https://recent.design/i/f3cwpo5-ai-image-generation-loading-state',
    creator: 'Aleksei Larionov (interface by Krea)',
    informed: 'Staged optimisation progress in Reflow Studio',
    reuse: 'Inspiration only',
    license: 'None stated',
  },
  {
    name: 'Animated Icon Set',
    url: 'https://recent.design/i/3ak7kef-animated-ui-icon-set',
    creator: 'James McDonald',
    informed: 'Restrained status micro-interactions',
    reuse: 'Inspiration only',
    license: 'None stated',
  },
];
