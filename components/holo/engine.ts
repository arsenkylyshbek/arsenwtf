/**
 * Holo — the maths and the materials behind a card that catches the light.
 *
 * Ported from the Airbnb identity-card build. The four ideas are unchanged:
 *
 *   ONE INPUT SHAPE. Pointer and device orientation both normalise to the same
 *   { x, y } in -1..1 before anything reads them.
 *
 *   THE FOIL LAGS THE CARD. Two followers at different stiffnesses is what
 *   turns a gradient that tracks a cursor into a material.
 *
 *   THE PRINT NEVER CHANGES. Only the foil above it does. Here the print is the
 *   site accent, so the cards recolour with the rest of the page.
 *
 *   MATERIALS ARE DATA, NOT CSS. Every material is three generic layers whose
 *   entire paint comes from custom properties, so adding one is adding an
 *   object to the array below.
 *
 * Removed for this project: the photo tile and its duotone flip (no player
 * photographs), the heart pattern, and the R2 media host — none of which have
 * an equivalent here.
 */

/** A normalised pointer/tilt reading. (0,0) is dead centre, (1,1) bottom-right. */
export interface Vec {
  x: number;
  y: number;
}

/** Scattered 4-point sparkles, inline so they cannot 404. */
const GLITTER = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27100%27%20height%3D%27100%27%20fill%3D%27%23fff%27%3E%3Cpath%20d%3D%27M34%2015.3L35.7%2019L34%2023.3L33.3%2019Z%27%20opacity%3D%270.54%27%2F%3E%3Cpath%20d%3D%27M38%207.5L39.3%2011L38%2014.7L37.1%2011Z%27%20opacity%3D%270.52%27%2F%3E%3Cpath%20d%3D%27M12%2010.6L13.2%2014L12%2017.4L11.1%2014Z%27%20opacity%3D%270.91%27%2F%3E%3Cpath%20d%3D%27M26%2056.4L27.1%2061L26%2066.1L24.2%2061Z%27%20opacity%3D%270.79%27%2F%3E%3Cpath%20d%3D%27M92%205.5L93.3%2010L92%2014.7L90.5%2010Z%27%20opacity%3D%270.64%27%2F%3E%3Cpath%20d%3D%27M16%2028.7L17.7%2033L16%2037.6L15.0%2033Z%27%20opacity%3D%270.59%27%2F%3E%3Cpath%20d%3D%27M62%2035.0L63.3%2039L62%2042.5L61.1%2039Z%27%20opacity%3D%270.53%27%2F%3E%3Cpath%20d%3D%27M24%2062.5L25.1%2066L24%2069.3L23.1%2066Z%27%20opacity%3D%270.66%27%2F%3E%3Cpath%20d%3D%27M46%2028.0L47.2%2032L46%2036.8L44.6%2032Z%27%20opacity%3D%270.85%27%2F%3E%3Cpath%20d%3D%27M57%2047.6L57.9%2052L57%2056.9L55.2%2052Z%27%20opacity%3D%270.86%27%2F%3E%3Cpath%20d%3D%27M92%2013.0L93.3%2016L92%2019.8L91.2%2016Z%27%20opacity%3D%270.88%27%2F%3E%3Cpath%20d%3D%27M49%205.4L50.3%209L49%2013.5L47.8%209Z%27%20opacity%3D%270.88%27%2F%3E%3Cpath%20d%3D%27M83%2029.5L84.3%2034L83%2037.8L81.8%2034Z%27%20opacity%3D%270.80%27%2F%3E%3Cpath%20d%3D%27M46%2075.1L47.6%2080L46%2084.8L44.7%2080Z%27%20opacity%3D%270.74%27%2F%3E%3C%2Fsvg%3E")`;

/** A dense star field for the deep-space material. */
const STARS = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27100%27%20height%3D%27100%27%20fill%3D%27%23fff%27%3E%3Ccircle%20cx%3D%2768%27%20cy%3D%2778%27%20r%3D%270.6%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%2726%27%20r%3D%270.5%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2711%27%20cy%3D%2733%27%20r%3D%270.5%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2720%27%20cy%3D%277%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2739%27%20cy%3D%2773%27%20r%3D%270.7%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2710%27%20cy%3D%2773%27%20r%3D%270.7%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2766%27%20cy%3D%2730%27%20r%3D%270.8%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2779%27%20cy%3D%2795%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2763%27%20cy%3D%2710%27%20r%3D%270.7%27%20opacity%3D%270.3%27%2F%3E%3Ccircle%20cx%3D%2745%27%20cy%3D%2748%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2750%27%20cy%3D%2737%27%20r%3D%270.7%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2789%27%20cy%3D%2724%27%20r%3D%270.3%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2728%27%20cy%3D%2740%27%20r%3D%270.7%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2769%27%20cy%3D%2775%27%20r%3D%270.4%27%20opacity%3D%270.3%27%2F%3E%3Ccircle%20cx%3D%2727%27%20cy%3D%279%27%20r%3D%270.4%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2747%27%20cy%3D%2711%27%20r%3D%270.6%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%271%27%20cy%3D%2738%27%20r%3D%270.6%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2793%27%20cy%3D%2757%27%20r%3D%270.6%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2765%27%20cy%3D%2721%27%20r%3D%270.4%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2726%27%20cy%3D%2788%27%20r%3D%270.7%27%20opacity%3D%270.9%27%2F%3E%3Ccircle%20cx%3D%2715%27%20cy%3D%2746%27%20r%3D%270.8%27%20opacity%3D%270.6%27%2F%3E%3Ccircle%20cx%3D%2732%27%20cy%3D%2737%27%20r%3D%270.5%27%20opacity%3D%270.8%27%2F%3E%3Ccircle%20cx%3D%2741%27%20cy%3D%274%27%20r%3D%270.5%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2737%27%20cy%3D%2759%27%20r%3D%270.5%27%20opacity%3D%270.5%27%2F%3E%3Ccircle%20cx%3D%2717%27%20cy%3D%2766%27%20r%3D%270.6%27%20opacity%3D%270.7%27%2F%3E%3Ccircle%20cx%3D%2751%27%20cy%3D%2787%27%20r%3D%271.6%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%275%27%20cy%3D%2768%27%20r%3D%271.6%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%2725%27%20cy%3D%2773%27%20r%3D%271.8%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%2728%27%20cy%3D%2715%27%20r%3D%271.4%27%20opacity%3D%27.95%27%2F%3E%3Ccircle%20cx%3D%2759%27%20cy%3D%2744%27%20r%3D%271.3%27%20opacity%3D%27.95%27%2F%3E%3C%2Fsvg%3E")`;

/** The six spectral hues the foil runs through. High value, high saturation:
 *  each layer's filter crushes them hard, so starting muted leaves nothing to
 *  crush. */
const S = [
  "hsl(2, 100%, 73%)",
  "hsl(53, 100%, 69%)",
  "hsl(93, 100%, 69%)",
  "hsl(176, 100%, 76%)",
  "hsl(228, 100%, 74%)",
  "hsl(283, 100%, 73%)",
];

/** A repeating spectral ramp at a given angle and pitch. */
function rainbow(angle: string, space: string, hues: string[] = S): string {
  const stops = hues
    .map((c, i) => `${c} calc(${space} * ${i + 1})`)
    .concat(`${hues[0]} calc(${space} * ${hues.length + 1})`)
    .join(", ");
  return `repeating-linear-gradient(${angle}, ${stops})`;
}

/** ONE LAYER of a material. Fields map one-to-one onto CSS properties. */
export interface Layer {
  img: string;
  size: string;
  /** Travel per unit of tilt. NEGATIVE runs it against the pointer, which is
   *  how two layers of one material come apart as the card turns. */
  rate: number;
  bgBlend?: string;
  blend: string;
  /** The crush. Contrast up, saturation down, turns a soft ramp into bands. */
  filter: string;
  /** Opacity face-on. */
  base: number;
  /** Added at full tilt. Negative fades a layer OUT as the card turns, handing
   *  the surface to the layer above rather than piling both on. */
  gain: number;
}

export interface Foil {
  key: string;
  label: string;
  layers: Layer[];
  /** How far the sheet slides per unit of tilt. THE most important number:
   *  1:1 reads as a gradient following a cursor, barely-moving reads as a
   *  layer sitting above the print. */
  parallax: number;
  bloom: number;
  glare: number;
}

export const FOILS: Foil[] = [
  {
    // Three layers rather than one: a single desaturated sheet reads as a
    // sheen, where a real holo has bands you can name moving against each other.
    key: "holo",
    label: "holo",
    layers: [
      {
        img: rainbow("10deg", "8%"),
        size: "380% 380%",
        rate: 1,
        blend: "overlay",
        filter: "brightness(1.08) contrast(2.3) saturate(1.5)",
        base: 0.26,
        gain: 0.6,
      },
      {
        // A second sheet at a crossing angle running BACKWARDS. Where the two
        // disagree they beat against each other — one sheet only ever slides,
        // two interfere.
        img: rainbow("104deg", "13%"),
        size: "300% 300%",
        rate: -0.7,
        blend: "color-dodge",
        filter: "brightness(.82) contrast(2) saturate(1.7)",
        base: 0.14,
        gain: 0.34,
      },
      {
        // Fine diffraction lines. Real foil is iridescent BECAUSE it is ridged;
        // without structure the colour reads as a filter over the card.
        img: "repeating-linear-gradient(96deg, rgba(255,255,255,.5) 0px, rgba(255,255,255,0) 2px, rgba(0,0,0,.16) 3px, rgba(255,255,255,0) 5px)",
        size: "auto",
        rate: 1.8,
        blend: "overlay",
        filter: "contrast(1.3)",
        base: 0.1,
        gain: 0.26,
      },
    ],
    parallax: 0.26,
    bloom: 0.55,
    glare: 0.55,
  },
  {
    // Two grayscale bar ramps crossed at ±45°. `exclusion` between them is the
    // trick: where they agree they cancel toward black, where they disagree
    // they light up, so the crossings sparkle with no colour in the layer.
    key: "prism",
    label: "prism",
    layers: [
      {
        img:
          "repeating-linear-gradient(45deg, hsl(0,0%,10%) 0%, hsl(0,0%,22%) 1.4%, hsl(0,0%,42%) 2.6%, hsl(0,0%,50%) 3.4%, hsl(0,0%,32%) 4.6%, hsl(0,0%,8%) 6%), " +
          "repeating-linear-gradient(-45deg, hsl(0,0%,10%) 0%, hsl(0,0%,24%) 1.6%, hsl(0,0%,46%) 3%, hsl(0,0%,52%) 3.8%, hsl(0,0%,28%) 5.2%, hsl(0,0%,8%) 6.6%)",
        size: "210% 210%, 190% 190%",
        rate: 1.5,
        bgBlend: "exclusion",
        blend: "color-dodge",
        filter: "brightness(.62) contrast(2.2) saturate(1.6)",
        base: 0.3,
        gain: 0.5,
      },
      {
        img: rainbow("55deg", "16%"),
        size: "400% 100%",
        rate: -2.5,
        blend: "color-dodge",
        filter: "brightness(.6) contrast(2.4) saturate(1.7)",
        base: 0.2,
        gain: 0.4,
      },
    ],
    parallax: 0.24,
    bloom: 0.55,
    glare: 0.52,
  },
  {
    // Three star plates at different scales and rates. The rate spread is the
    // whole effect: near stars sweep, far stars barely move.
    key: "cosmos",
    label: "cosmos",
    layers: [
      {
        img: `${STARS}, ${rainbow("82deg", "8%")}`,
        size: "38% 38%, 420% 900%",
        rate: 0.35,
        bgBlend: "color-burn",
        blend: "color-dodge",
        filter: "brightness(1) contrast(1.6) saturate(.9)",
        base: 0.28,
        gain: 0.45,
      },
      {
        img: STARS,
        size: "22% 22%",
        rate: 1.6,
        blend: "overlay",
        filter: "brightness(1.3) contrast(1.7)",
        base: 0.2,
        gain: 0.4,
      },
      {
        img: `${GLITTER}, ${GLITTER}`,
        size: "24% 24%, 17% 17%",
        rate: 2.6,
        bgBlend: "hard-light",
        blend: "overlay",
        filter: "brightness(1.1) contrast(1.5)",
        base: 0.12,
        gain: 0.3,
      },
    ],
    parallax: 0.34,
    bloom: 0.55,
    glare: 0.46,
  },
];

export function foilByKey(key?: string): Foil {
  return FOILS.find((f) => f.key === key) ?? FOILS[0];
}

/** Maximum tilt at the card's edge. Small: past ~16° the perspective
 *  distortion reads as a fold rather than a tilt. */
export const MAX_TILT = 14;

/** Remap a value from one range onto another. */
export function adjust(
  v: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  return toMin + ((toMax - toMin) * (v - fromMin)) / (fromMax - fromMin);
}

export function clamp(v: number, min = -1, max = 1): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * A damped follower.
 *
 * Not a spring with overshoot — a simple exponential ease. A card settling
 * should look like weight, not like a bounce; a bouncing card immediately
 * reads as a web animation rather than an object.
 */
export class Follow {
  value: Vec = { x: 0, y: 0 };
  target: Vec = { x: 0, y: 0 };
  /** Per-frame delta. Position alone can't tell a creep from a whip, and a
   *  material that answers both identically doesn't read as physical. */
  velocity: Vec = { x: 0, y: 0 };
  /** Smoothed magnitude, 0..1-ish. Raw deltas are spiky enough to flicker. */
  speed = 0;

  constructor(private stiffness: number) {}

  step() {
    const px = this.value.x;
    const py = this.value.y;
    this.value.x += (this.target.x - this.value.x) * this.stiffness;
    this.value.y += (this.target.y - this.value.y) * this.stiffness;
    this.velocity.x = this.value.x - px;
    this.velocity.y = this.value.y - py;
    // Asymmetric: rises fast so a flick registers on the frame it happens,
    // falls slowly so the streak decays instead of snapping off.
    const raw = Math.min(1, Math.hypot(this.velocity.x, this.velocity.y) * 14);
    this.speed += (raw - this.speed) * (raw > this.speed ? 0.45 : 0.06);
  }

  /** True once it has effectively arrived, so the rAF loop can stop. */
  get settled(): boolean {
    return (
      Math.abs(this.target.x - this.value.x) < 0.0006 &&
      Math.abs(this.target.y - this.value.y) < 0.0006 &&
      this.speed < 0.004
    );
  }
}

/**
 * A one-shot overshoot for the moment the pointer leaves. Deliberately NOT a
 * spring on the main follower: a spring rings on every movement, and a card
 * that wobbles whenever you nudge it reads as an animation.
 */
export class Kick {
  private amount: Vec = { x: 0, y: 0 };
  private life = 0;

  fire(v: Vec, gain = 2.6) {
    const mag = Math.hypot(v.x, v.y);
    // Below a threshold there was no throw — just a pointer leaving the box.
    if (mag < 0.002) return;
    this.amount = { x: v.x * gain, y: v.y * gain };
    this.life = 1;
  }

  step(): Vec {
    if (this.life <= 0) return { x: 0, y: 0 };
    this.life = Math.max(0, this.life - 0.035);
    // A half sine over the life: rises to the overshoot, returns through zero.
    // Ending at exactly zero matters — a decaying oscillation would leave the
    // card fractionally off true.
    const e = Math.sin(this.life * Math.PI) * this.life;
    return { x: this.amount.x * e, y: this.amount.y * e };
  }

  get active(): boolean {
    return this.life > 0;
  }
}

/**
 * Device orientation, zeroed on the first reading.
 *
 * THE DETAIL THAT MAKES TILT USABLE. Absolute orientation is useless — nobody
 * holds a phone flat, so an un-zeroed reading pins the card to one corner and
 * it never comes back.
 */
export class Orientation {
  private base: { beta: number; gamma: number } | null = null;
  /** Degrees of tilt mapping to the full -1..1 range. Small, because wrist
   *  movement is small. */
  private range = 22;

  read(e: DeviceOrientationEvent): Vec | null {
    const beta = e.beta;
    const gamma = e.gamma;
    if (beta == null || gamma == null) return null;
    if (!this.base) {
      this.base = { beta, gamma };
      return { x: 0, y: 0 };
    }
    return {
      x: clamp((gamma - this.base.gamma) / this.range),
      y: clamp((beta - this.base.beta) / this.range),
    };
  }
}

/** Pointer position within an element, normalised to -1..1 from its centre. */
export function fromPointer(rect: DOMRect, cx: number, cy: number): Vec {
  return {
    x: clamp(((cx - rect.left) / rect.width) * 2 - 1),
    y: clamp(((cy - rect.top) / rect.height) * 2 - 1),
  };
}

export interface Motion {
  speed?: number;
  velocity?: Vec;
  /** Seconds since mount, for the slow resting cycles. */
  time?: number;
}

/** How many foil layers the CSS provides. */
export const LAYER_SLOTS = 3;

/** Write one frame's worth of CSS variables onto the card element. */
export function applyFrame(
  card: HTMLElement,
  tilt: Vec,
  sheet: Vec,
  foil: Foil,
  motion: Motion = {},
): void {
  const { x, y } = tilt;
  const s = card.style;

  s.setProperty("--rx", `${(-y * MAX_TILT).toFixed(2)}deg`);
  s.setProperty("--ry", `${(x * MAX_TILT).toFixed(2)}deg`);

  const p = foil.parallax;

  // EACH LAYER MOVES AT ITS OWN RATE, some against the pointer. Two layers
  // travelling together are just one thicker layer; the disagreement is what
  // reads as depth.
  for (let i = 0; i < LAYER_SLOTS; i++) {
    const L = foil.layers[i];
    if (!L) continue;
    const t = p * L.rate;
    const n = `--l${i + 1}`;
    s.setProperty(
      `${n}-x`,
      `${adjust(sheet.x, -1, 1, 50 - t * 100, 50 + t * 100).toFixed(1)}%`,
    );
    s.setProperty(
      `${n}-y`,
      `${adjust(sheet.y, -1, 1, 50 - t * 100, 50 + t * 100).toFixed(1)}%`,
    );
  }

  // HOW FAR FROM FACE-ON, 0..1 — the card's whole decoration budget. A
  // DISTANCE, so it is symmetric: tilting either way lights the card the same.
  const off = Math.min(1, Math.hypot(x, y));

  // THE SWEET SPOT. Real foil has one angle where the surface lines up and goes
  // brilliant, and hunting for it is most of why anyone keeps turning a card.
  // Off-centre on purpose: the middle is where the card rests, and a bloom you
  // get for free isn't worth finding.
  const SPOT = { x: -0.42, y: -0.36 };
  const dSpot = Math.hypot(sheet.x - SPOT.x, sheet.y - SPOT.y);
  const hit = Math.max(0, 1 - dSpot / 0.34);
  const spotBloom = hit * hit * (3 - 2 * hit);

  // Two incommensurate periods, so the resting cycle never visibly loops.
  const time = motion.time ?? 0;
  const breath = 0.5 + 0.5 * Math.sin(time * 0.5) * Math.cos(time * 0.31);

  for (let i = 0; i < LAYER_SLOTS; i++) {
    const L = foil.layers[i];
    if (!L) continue;
    let o = Math.max(0, L.base + off * L.gain * (foil.bloom / 0.5));
    // The sweet spot lifts every layer at once — that simultaneity is what
    // reads as the material aligning rather than one sheet brightening.
    o *= 1 + spotBloom * 0.85;
    o *= 0.94 + breath * 0.06;
    s.setProperty(`--l${i + 1}-o`, Math.min(1, o).toFixed(3));
  }

  // The conic material spins rather than slides. Harmless for the others.
  s.setProperty("--spin", `${(sheet.x * 90 + sheet.y * 45).toFixed(1)}deg`);

  // The glare tracks the pointer DIRECTLY, with no lag — a highlight is simply
  // where the light is, so lagging it would look like a mistake.
  s.setProperty("--gx", `${adjust(x, -1, 1, 12, 88).toFixed(1)}%`);
  s.setProperty("--gy", `${adjust(y, -1, 1, 12, 88).toFixed(1)}%`);

  const speed = motion.speed ?? 0;
  const vel = motion.velocity ?? { x: 0, y: 0 };

  // THE STREAK. A fast pass smears the highlight along the direction of travel;
  // a slow one leaves it round.
  if (Math.hypot(vel.x, vel.y) > 0.0001) {
    s.setProperty(
      "--smear-angle",
      `${(Math.atan2(vel.y, vel.x) * (180 / Math.PI)).toFixed(0)}deg`,
    );
  }
  s.setProperty("--smear", (Math.min(1, speed) * 0.8).toFixed(3));
  s.setProperty("--spot", spotBloom.toFixed(3));

  // EMBOSSING. Highlight opposite the shadow, both from tilt, so the type
  // catches light like it was pressed into the stock. Under a pixel: an emboss
  // you can measure is a bevel.
  s.setProperty("--emboss-x", `${(-x * 0.9).toFixed(2)}px`);
  s.setProperty("--emboss-y", `${(-y * 0.9).toFixed(2)}px`);

  // EDGE CATCH. Each border lights by how much it faces you, so the card reads
  // as having thickness instead of a uniform rim.
  s.setProperty("--edge-l", Math.max(0, -x).toFixed(3));
  s.setProperty("--edge-r", Math.max(0, x).toFixed(3));
  s.setProperty("--edge-t", Math.max(0, -y).toFixed(3));
  s.setProperty("--edge-b", Math.max(0, y).toFixed(3));
}

/**
 * Push a material's static variables onto the card.
 *
 * Unused slots are explicitly blanked: switching materials has to CLEAR the old
 * slots, or the previous material's layers stay painted underneath.
 */
export function applyFoil(card: HTMLElement, foil: Foil): void {
  const s = card.style;
  s.setProperty("--glare-o", `${foil.glare}`);

  for (let i = 0; i < LAYER_SLOTS; i++) {
    const n = `--l${i + 1}`;
    const L = foil.layers[i];
    if (!L) {
      // `none` rather than an empty string: an empty background-image is
      // invalid and falls back to the previous declaration.
      s.setProperty(`${n}-img`, "none");
      s.setProperty(`${n}-o`, "0");
      continue;
    }
    s.setProperty(`${n}-img`, L.img);
    s.setProperty(`${n}-size`, L.size);
    s.setProperty(`${n}-bgblend`, L.bgBlend ?? "normal");
    s.setProperty(`${n}-blend`, L.blend);
    s.setProperty(`${n}-filter`, L.filter);
  }
}
