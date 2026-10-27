# SAYR — Design references

SAYR is a precision-engineered healthcare **operations** interface built around four signature pieces: the **Flow Canvas**, **Reflow Studio**, **Ripple Trace** and the **Minutes Ledger**. It was entered in the same competition as a separate AI medical-diagnosis project, so its visual language was designed to be deliberately different: warm-white paper, navy ink, teal and copper accents, serif editorial numerals, and flat 2D SVG instead of any 3D, anatomical or evidence-inspection imagery.

**Team** — ADNOC School – Madinat Zayed:
Lujain Ahmed Mourad (8D) · Yosr Amgad (8D) · Precious Fuentes (8D) · Maryam Ammara Jelita (8D) · Eleen Amr (8D) · Shaden Ahmed Mourad (6D)

## Summary of what was and was not reused

| Question | Answer |
| --- | --- |
| Was any asset, code, scene, illustration or video from a reference reused? | **No.** All ten references were studied for principles only. |
| Does the app embed any Spline scene or Hana export? | **No.** No exported embed exists for this project, so none is shipped (see “Spline embed status”). |
| Does the app load any third-party design service at runtime? | **No.** Fonts are system fonts, graphics are inline SVG/CSS, and the whole prototype runs offline. |
| Are the two Spline community files (CC BY 4.0) credited? | **Yes**, below and in the in-app About panel, even though nothing from them is reused. |

Metadata below (creator, license) was read from each page on **2026-10-27**. Where a page states no license, that is recorded as “none stated”; absence of a stated license is not treated as permission, which is why nothing was reused.

## A. Spline references

### 1. Spline Hana
- **URL:** https://spline.design/hana
- **Creator:** Spline (product page)
- **Informed:** the state-and-transition way of thinking behind **Reflow** (an object has a *before* state, an *after* state and a transition between them) and the preference for vector 2D over 3D scenes.
- **Reuse:** inspiration only. No Hana scene, runtime or export is used.
- **License / attribution:** product marketing page; governed by Spline’s Terms. Nothing taken.
- **How SAYR differs:** Reflow’s transition is not authored in a design tool. Each block’s position is interpolated in React between the optimizer’s *before* plan and *after* plan, so the motion is the optimizer’s output.

### 2. Charts with interactive hover animation
- **URL:** https://community.spline.design/file/322b331b-3950-46e4-a049-8a61bcdb710e
- **Creator:** @marinach (published 2024-10-11)
- **Informed:** hover behaviour of the **Minutes Ledger** waterfall (focus a bar, soften the others, reveal detail).
- **Reuse:** inspiration only. The scene was not remixed or embedded.
- **License / attribution:** CC BY 4.0. Credit: *“Charts with interactive hover animation” by @marinach, Spline Community.* Attribution is given here and in the About panel although nothing is reused.
- **How SAYR differs:** the SAYR waterfall is a data-driven SVG whose bars are real replays of the simulated day, not an illustrative chart.

### 3. Flow
- **URL:** https://community.spline.design/file/ff4fcef4-b6ab-406f-9359-d639509f2d99
- **Creator:** @vladkolokolnikov (published 2024-07-06)
- **Informed:** the idea of expressing interconnected movement as continuous connected paths, applied to **journey lines** on the Flow Canvas.
- **Reuse:** inspiration only. The scene was not remixed or embedded.
- **License / attribution:** CC BY 4.0. Credit: *“Flow” by @vladkolokolnikov, Spline Community.*
- **How SAYR differs:** the original is a dark, neon, wire-based hero. SAYR’s lines are warm-paper hairlines that turn copper only where a patient’s wait crosses 15 minutes. Colour carries data, not decoration.

### 4. Auto Layout 3D List
- **URL:** https://app.spline.design/ui/a3144449-bf5c-4189-a3f1-dda35c699bc4
- **Creator:** not stated on the page when fetched
- **Informed:** the stacked, expandable card pattern of the **Action Desk**.
- **Reuse:** inspiration only.
- **License / attribution:** not stated on the page.
- **How SAYR differs:** flat 2D cards, no 3D depth. Expanding a card reveals feasibility checks, the list of changed appointments and approval controls.

### 5. Animated Icons (Spline UI)
- **URL:** https://app.spline.design/ui/9389d529-f05b-4aa7-9360-11175d1b4e72
- **Creator:** not stated on the page when fetched
- **Informed:** the minimal animated status glyphs on each lane (idle ring, busy pulse, hatched outage, tick and cross).
- **Reuse:** inspiration only. The glyphs are original SVG.
- **License / attribution:** not stated on the page.
- **How SAYR differs:** the glyph shown is chosen from real resource state, and the pulse is disabled under `prefers-reduced-motion`.

### Spline implementation documentation
- **URL:** https://docs.spline.design/hana-a-canvas-for-interactivity/assets-and-export/exporting-in-hana
- **Used for:** understanding how a Hana frame is exported (public URL, iframe embed or native `<hana-viewer>` embed; only parent frames can be exported). No export was made.

### Spline embed status
No Spline or Hana embed is shipped. The community pages above have no runtime URL of their own (a community file must first be remixed and published to obtain one), and nothing was fabricated. The primary simulation, the Flow Canvas and every operational calculation live in React/TypeScript and do not depend on Spline being available. If a team member later publishes an original Hana frame, add it as an optional enhancement with an SVG/CSS fallback, keep the real exported URL out of source until it exists, and add its credit here.

## B. Recent references

### 6. Thumbnail Grid Transition
- **URL:** https://recent.design/i/fgweqvk-thumbnail-grid-transition
- **Creator:** Corentin Bernadou
- **Informed:** the staggered choreography of **Reflow** (items leave and settle one after another rather than all at once).
- **Reuse:** inspiration only. No WebGL, code or media taken.
- **License / attribution:** none stated on the page.
- **How SAYR differs:** the stagger order is computed from the size of each appointment’s move in the optimizer result (largest movers first). Cross-lane moves leave a dotted trail and a dashed ghost at the old position.

### 7. Spacing Tips
- **URL:** https://recent.design/i/qbsvs1j-spacing-visualization-dashboard
- **Creator:** Michael Filipiuk
- **Informed:** the consistent spacing scale and panel composition used across every screen.
- **Reuse:** inspiration only.
- **License / attribution:** none stated on the page.
- **How SAYR differs:** SAYR uses an 8/12/18/26 px rhythm with panels on a warm paper ground and oversized serif numerals as the primary hierarchy.

### 8. iOS Gesture Studies
- **URL:** https://recent.design/i/qsi4mth-x-com
- **Creator:** Juliette
- **Informed:** the feel of dragging an appointment on the **Resource Board**: the block follows the pointer, the target lane responds, and the result settles (or refuses) with a short decelerating motion.
- **Reuse:** inspiration only.
- **License / attribution:** none stated on the page.
- **How SAYR differs:** the drop target is validated live by the same decoder and constraint checker the optimizer uses, so infeasible drops are refused with the specific rule that failed.

### 9. Krea Image Generation — progressive loading state
- **URL:** https://recent.design/i/f3cwpo5-ai-image-generation-loading-state
- **Creator:** Aleksei Larionov (the interface shown is Krea’s)
- **Informed:** the staged, transparent progress of the optimizer in **Reflow Studio**.
- **Reuse:** inspiration only.
- **License / attribution:** none stated on the page.
- **How SAYR differs:** every stage label and number is real: the plan counts captured, the objective value after each search pass and the nine constraints re-checked. Nothing is a timed placeholder.

### 10. Animated Icon Set
- **URL:** https://recent.design/i/3ak7kef-animated-ui-icon-set
- **Creator:** James McDonald
- **Informed:** restrained operational status micro-interactions.
- **Reuse:** inspiration only.
- **License / attribution:** none stated on the page.
- **How SAYR differs:** motion appears only where state changes meaning (a lane starts work, a constraint passes or fails).

## C. Distinctness from the diagnostic project

SAYR does not use any of the following: biomedical or anatomical imagery, 3D medical models, an isometric clinic, scientific evidence-inspection motifs, a split-screen comparison treatment, particles, glowing orbs or generic AI gradients. Its identity comes from dispatch boards, scheduling grids, editorial typography and a copper/teal/navy palette on warm white. Its signature interactions are **Reflow** (ghost overlay and choreographed block move), **Ripple Trace** (a dependency tree built from the event log) and the **Minutes Ledger** (a measured waterfall).

## D. Verification log (2026-10-27)

- All ten reference URLs and the Hana export documentation page were fetched successfully and their titles, creators and license statements recorded above. A separate HTTP check returned **200** for all 11 URLs.
- No Spline or Hana embed is present in the application; there is nothing to verify as a real export, and no placeholder embed exists.
- The application makes no network requests for design services. Fonts are system fonts; there are no hot-linked images, videos or scripts.
- Motion respects `prefers-reduced-motion`: Reflow jumps straight to the result (the Before/After scrubber remains available), pulses are removed, and Ripple Trace reveals all hops at once.
