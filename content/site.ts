/**
 * All site content lives here.
 *
 * Plain data, no JSX — so entries stay easy to edit, reorder, and eventually
 * move to a CMS or MDX without touching a component.
 *
 * ── WRITING PROSE ──────────────────────────────────────────────────────────
 *
 * Any `body` or `intro` string understands two bits of markup:
 *
 *     [air street](https://press.airstreet.com)   → a link
 *     :bay cloud:                                 → an inline logo
 *     :the personal ai company:                   → keys may contain spaces
 *
 * Links name the label and the url separately on purpose. With `amurex[url]`
 * there'd be no way to tell whether the link is "amurex" or the whole phrase
 * before it, so "air street" and "product hunt" could never be links.
 *
 * Logo keys come from LOGOS in components/rich-text.tsx — currently
 * bay cloud / bay, speko, yc, omi, delfa, amurex / the personal ai company,
 * github, x,
 * linkedin, product hunt, ef / entrepreneur first, and `amurex stars` (the
 * live github star badge). Several keys may point at one file. Drop a
 * file in public/logos/ and add a line there to make a new one. An unknown
 * key renders as plain `:typo:` rather than disappearing, so a mistake is
 * visible instead of silent.
 *
 * Everything else is left exactly as typed — no escaping needed, and a stray
 * bracket is just a bracket.
 * ───────────────────────────────────────────────────────────────────────────
 */

export type Entry = {
  /** Stable id, unique within its section. Numbers, not slugs — a title
   *  should be free to change without the id going stale. */
  id: number;
  /** Left column. The thing itself. */
  title: string;
  /**
   * A short qualifier set right after the title. Job title in `work`, but
   * deliberately un-named so any list can use it — who you were with in
   * `places`, top speed in `airplanes`, position in `football`.
   */
  note?: string;
  /** Right column. Year, season — whatever the honest metadata is. */
  meta?: string;
  /** Shown on hover, desktop only. One image; keep it small and light. */
  preview?: string;
  /** Shown in the modal. The full set. */
  images?: string[];
  /** Modal body, one string per paragraph. */
  body?: string[];
  links?: { label: string; href: string }[];
  /** A live site to embed in the modal. Rendered at desktop width and
   *  scaled down, so it shows the design as built rather than a squeezed
   *  mobile layout. */
  embed?: string;
  /** Photo attribution. Required by the licence on anything from Commons that
   *  isn't public domain — rendered under the image in the modal. */
  credit?: string;
  /** [lat, lon]. Only the atlas uses this — it's how a place gets a pin. */
  coords?: [number, number];
  /** Only the atlas uses this — it's how cities group in the list below. */
  country?: string;
  /** Only football uses this — it turns the entry into a player card. */
  card?: PlayerCard;
};

/** A FIFA-style player card. `foil` picks which laminate it's printed under. */
export type PlayerCard = {
  /** Shirt number. The card's hero figure, where FIFA puts the rating. */
  number: number;
  /** Short position code — st, cdm, gk. */
  position: string;
  /** Three at most; the row is a fixed grid and a fourth breaks the rhythm. */
  stats: { label: string; value: string }[];
  /** One line under the stats, for anything that isn't a number. */
  honour?: string;
  /** Key from FOILS in components/holo/engine.ts. */
  foil?: string;
};

export type Section = {
  /** Matches the rail item's href, minus the hash. */
  id: string;
  title: string;
  /** What renders inside. `list` is the default and the site's grammar;
   *  the others are deliberate departures from it. */
  kind?: "list" | "map" | "cards" | "album";
  /** Optional prose above the section's contents, one string per paragraph.
   *  Only `family` uses it — it's the one section that isn't an index. */
  intro?: string[];
  entries: Entry[];
};

/**
 * Whether an entry has anything worth opening. Rows and pins without detail
 * render as plain marks rather than as controls that lead to an empty panel.
 */
export function hasDetail(entry: Entry) {
  return Boolean(
    entry.body?.length || entry.images?.length || entry.links?.length,
  );
}

/**
 * The top of the page.
 *
 * No adjectives about myself — what i'm building, where i've been, and a way
 * to check. Anyone can call themselves a founder; the specifics are the part
 * that can be verified.
 */
export const INTRO = {
  name: "arsen kylyshbek",
  avatar: "/avatar.jpg",
  lead: "hey, i'm arsen :)",
  body: [
    "i'm building :bay cloud: [bay cloud](https://thebay.cloud) - cloud for ai generated code.",
    "i'm also a founding engineer at :speko: [speko](https://speko.ai) (:yc: yc s26) - openrouter for voice ai.",
    "born in kazakhstan, now in london. before this i cofounded :the personal ai company: [the personal ai company](https://github.com/thepersonalaicompany/amurex) and was cto there. we raised $250k from :entrepreneur first: [entrepreneurs first](https://www.joinef.com/wp-content/themes/joinef2023/img/framework/logo-new.svg), got 2.9k stars on github and became #2 product of the day on :product hunt: [product hunt](https://www.producthunt.com/products/amurex/launches/amurex)",
    "i've been building since i was 10, and definitely will be building forever. i'm very much into product and design side, but can/would love to take over the deeper infra stuff too.",
    "i'm also into airplanes - at some point i'll build a supersonic one!"
  ],
  links: [
    { label: "x", href: "https://x.com/arsenfounder" },
    { label: "github", href: "https://github.com/arsenkylyshbek" },
    { label: "linkedin", href: "https://www.linkedin.com/in/arsenkk/" },
  ],
};

export const SECTIONS: Section[] = [
  {
    id: "work",
    title: "work",
    entries: [
      {
        id: 5,
        title: "speko ai (yc s26)",
        note: "founding engineer",
        meta: "2026-",
        embed: "https://speko.ai",
        preview: "/shots/speko.jpg",
        body: ["openrouter for voice ai. yc s26."],
        links: [{ label: "speko.ai", href: "https://speko.ai" }],
      },
      {
        id: 1,
        title: "bay cloud",
        note: "co-founder",
        meta: "2026-",
        preview: "/work/bay.jpg",
        body: [
          "the cloud for the ai era. one command — npx bay ship — and it reads your stack, provisions the infrastructure, and hands back a live url in about forty seconds. database, storage and custom domains come with it rather than being four more decisions.",
          "the part that isn't just a faster heroku: it watches production, and when something breaks the internal ai reads the code, writes the patch and redeploys on its own. built so a coding agent can own its own deployments end to end, which is the actual bet — the deployer stops being a person.",
        ],
        images: ["/work/bay.jpg"],
        links: [{ label: "thebay.cloud", href: "https://thebay.cloud" }],
      },
      {
        id: 2,
        title: "omi ai",
        note: "founding engineer",
        meta: "2025",
        preview: "/work/omi.jpg",
        body: [
          "backend for a wearable that listens all day. python and fastapi behind the real-time transcription, diarization and conversation pipelines.",
          "most of my time went into diarization — deciding who spoke when, on streaming audio, across multiple asr providers with custom logic layered on top of deepgram. then persistent speaker tagging, so the device remembers a voice between sessions instead of meeting everyone again each morning. also built omi desktop, keeping transcripts, insights and actions in sync across device, cloud and laptop.",
        ],
        images: ["/work/omi.jpg"],
        links: [
          { label: "omi.me", href: "https://www.omi.me/" },
          {
            label: "techcrunch",
            href: "https://techcrunch.com/2025/01/08/omi-a-competitor-to-friend-wants-to-boost-your-productivity-using-ai-and-a-brain-interface/",
          },
        ],
      },
      {
        id: 3,
        title: "delfa ai",
        note: "contract backend engineer",
        meta: "2025",
        preview: "/work/delfa.jpg",
        body: [
          "clinical trials have a recruitment problem: sites spend most of their time on the phone prescreening people who turn out not to qualify. delfa puts an ai agent on that call. i built the fastapi services behind it — ingesting and orchestrating patient interaction data — plus n8n workflows that fire on a call and run the whole chain: extract, validate, schedule.",
          "the interesting problem was intent. taking a retell ai transcript, live or after the call, and pulling structured scheduling out of speech — who the patient is, which site, what kind of visit, what time windows work. that fed a central calendar and api layer giving every site one real-time view of the book.",
          "they raised $3.8m from [air street](https://press.airstreet.com/p/our-investment-in-delfa-to-fix-clinical) and are live across 50+ trials.",
        ],
        images: ["/work/delfa.jpg"],
        links: [
          { label: "delfa.ai", href: "https://www.delfa.ai/" },
          {
            label: "air street",
            href: "https://press.airstreet.com/p/our-investment-in-delfa-to-fix-clinical",
          },
        ],
      },
      {
        id: 4,
        title: "the personal ai company",
        note: "cto",
        meta: "2024-2025",
        preview: "/work/amurex.jpg",
        body: [
          "amurex — an open-source ai layer over the things you already use. i built a federated search engine indexing gmail, drive, notion and obsidian through oauth2 connectors, on postgres and elasticsearch, so one query reaches all of it.",
          "then inbox automation in node microservices over imap/smtp that auto-categorised and prioritised mail, which cut average triage time by 40%. and a chrome extension streaming meeting audio to a fastapi backend for transcription and summarisation with llama 3 on groq.",
          "[:amurex stars:](https://github.com/thepersonalaicompany/amurex) over 99% uptime, shipping weekly. raised a $250k pre-seed and took it to product of the week on :product hunt: [product hunt](https://www.producthunt.com/products/amurex).",
        ],
        images: ["/work/amurex.jpg"],
        links: [
          { label: "github", href: "https://github.com/thepersonalaicompany/amurex" },
          { label: "product hunt", href: "https://www.producthunt.com/products/amurex" },
          { label: "show hn", href: "https://news.ycombinator.com/item?id=42516090" },
        ],
      },
      {
        id: 10,
        title: "baseprompt",
        note: "founder",
        meta: "2024",
        preview: "/work/baseprompt.png",
        body: [
          "llm orchestration you drive through an api. django and postgres underneath, react and next on top for visualising a workflow rather than reading it as yaml.",
          "the piece i'd build again is the evaluation layer: pytest plus custom benchmark datasets, run against every change, flagging hallucinations and regressions before a prompt shipped. multi-tenant with rbac, 100+ early adopters.",
          "i was eighteen, doing b2b sales and raising angel money in the morning and holding the whole stack — infra, backend, frontend — in the afternoon.",
        ],
        images: ["/work/baseprompt.png"],
        links: [
          { label: "github", href: "https://github.com/baseprompt" },
          {
            label: "tracxn",
            href: "https://tracxn.com/d/companies/baseprompt/__Wn2dCoQGVKgY6P2O3otzJDCCP__NODeDk2sOWIG-lBk",
          },
        ],
      },
    ],
  },
  {
    id: "hangar",
    title: "hangar",
    intro: [
      "everything i've built that wasn't a job. some of it shipped and found users, some stalled at eighty percent, one of them is the site you're reading right now.",
      "basically these are the best designs i've ever built.",
    ],
    entries: [
      {
        id: 2,
        title: "dial",
        embed: "https://dialnow.app",
        links: [{ label: "dialnow.app", href: "https://dialnow.app" }],
        meta: "2026",
        preview: "/shots/dial.jpg",
        body: ["an ai friend you can actually call."],
      },
      {
        id: 3,
        title: "agentnotes",
        preview: "/shots/agentnotes.jpg",
        embed: "https://agentnotes.cc",
        links: [{ label: "agentnotes.cc", href: "https://agentnotes.cc" }],
        meta: "2026",
        body: ["personal notes, written and read by an agent."],
      },
      {
        id: 4,
        title: "sonic crm",
        embed: "https://crmsonic.kz",
        links: [{ label: "crmsonic.kz", href: "https://crmsonic.kz" }],
        meta: "2026",
        preview: "/shots/sonic.jpg",
        body: ["ai native crm for asia."],
      },
      {
        id: 5,
        title: "hattori",
        preview: "/shots/hattori.jpg",
        embed: "https://www.hattori.app/",
        links: [{ label: "hattori.app", href: "https://www.hattori.app/" }],
        meta: "2025",
        body: ["ai that does your boring work."],
      },
      {
        id: 6,
        title: "this site",
        meta: "2026",
        body: [
          "paper texture built from three layers of svg turbulence. press ⌥s to see the whole thing annotate itself.",
        ],
      },
    ],
  },
  {
    id: "family",
    title: "family + friends",
    kind: "album",
    intro: [
      "i've been lucky with people. some of them i was born to. the rest i met in a school corridor, a dressing room, a group chat, a five-a-side pitch in kuala lumpur. the difference between friends and family stopped meaning much a while ago.",
      "that's the part nobody warns you about when you move a lot: you don't lose people, you just end up with family in more time zones than you can keep track of. someone i love is awake right now, somewhere.",
      "these are just a few of them:",
    ],
    entries: [
      // CAPTIONS ARE MINE AND DELIBERATELY BARE — they describe what's in the
      // frame and nothing else. I don't know who these people are to you, and
      // guessing would put a claim about someone else's life on your website.
      // Names, if any, are yours to add.
      {
        id: 1,
        title: "my lovely family",
        meta: "2023",
        preview: "/photos/family.jpg",
        images: ["/photos/family.jpg"],
      },
      {
        id: 2,
        title: "ship it, san francisco",
        meta: "2025",
        preview: "/photos/ship-it.jpg",
        images: ["/photos/ship-it.jpg"],
      },
      {
        id: 3,
        title: "yc startup school, india",
        meta: "2026",
        preview: "/photos/startup-school.jpg",
        images: ["/photos/startup-school.jpg"],
      },
      {
        id: 4,
        title: "somewhere warm",
        meta: "2026",
        preview: "/photos/loungers.jpg",
        images: ["/photos/loungers.jpg"],
      },
      {
        id: 5,
        title: "the cat",
        meta: "2026",
        preview: "/photos/cat.jpg",
        images: ["/photos/cat.jpg"],
      },
      {
        id: 6,
        title: "my home",
        meta: "2026",
        preview: "/photos/in-the-car.jpg",
        images: ["/photos/in-the-car.jpg"],
      },
    ],
  },
  {
    id: "places",
    title: "places",
    kind: "map",
    entries: [
      {
        id: 1,
        title: "london",
        country: "united kingdom",
        meta: "2026",
        coords: [51.51, -0.13],
        preview: "/previews/placeholder-a.svg",
        body: ["where i am now."],
      },
      {
        id: 2,
        title: "san francisco",
        country: "united states",
        meta: "2024",
        coords: [37.77, -122.42],
        preview: "/previews/placeholder-b.svg",
        body: ["placeholder — swap for the real story."],
      },
      {
        id: 3,
        title: "almaty",
        country: "kazakhstan",
        meta: "2023",
        coords: [43.24, 76.89],
        body: ["placeholder."],
      },
      {
        id: 4,
        title: "astana",
        country: "kazakhstan",
        meta: "2022",
        coords: [51.16, 71.47],
        body: ["placeholder."],
      },
      {
        id: 5,
        title: "istanbul",
        country: "turkiye",
        meta: "2023",
        coords: [41.01, 28.98],
        preview: "/previews/placeholder-c.svg",
        body: ["placeholder."],
      },

      // No year or story on these yet — a pin with nothing behind it shows its
      // name on hover but won't open an empty modal. Add `meta` and `body` as
      // you fill them in and they become clickable.
      { id: 6, title: "new york", country: "united states", coords: [40.71, -74.01] },
      { id: 7, title: "boston", country: "united states", coords: [42.36, -71.06] },
      { id: 8, title: "los angeles", country: "united states", coords: [34.05, -118.24] },
      { id: 9, title: "sacramento", country: "united states", coords: [38.58, -121.49] },
      { id: 10, title: "moscow", country: "russia", coords: [55.76, 37.62] },
      { id: 11, title: "tashkent", country: "uzbekistan", coords: [41.31, 69.24] },
      { id: 12, title: "manchester", country: "united kingdom", coords: [53.48, -2.24] },
      { id: 13, title: "athens", country: "greece", coords: [37.98, 23.73] },
      { id: 14, title: "antalya", country: "turkiye", coords: [36.9, 30.71] },
      { id: 15, title: "new delhi", country: "india", coords: [28.61, 77.21] },
      { id: 16, title: "bangalore", country: "india", coords: [12.97, 77.59] },
      { id: 17, title: "bangkok", country: "thailand", coords: [13.76, 100.5] },
      { id: 18, title: "kuala lumpur", country: "malaysia", coords: [3.14, 101.69] },
      { id: 19, title: "ho chi minh", country: "vietnam", coords: [10.82, 106.63] },
      { id: 20, title: "nha trang", country: "vietnam", coords: [12.24, 109.19] },
    ],
  },
  {
    id: "football",
    title: "football",
    kind: "cards",
    entries: [
      {
        id: 1,
        title: "saigon street fc",
        note: "ho chi minh",
        card: {
          number: 57,
          position: "st",
          stats: [
            { label: "games", value: "3" },
            { label: "goals", value: "1" },
            { label: "assists", value: "0" },
          ],
          foil: "holo",
        },
      },
      {
        id: 2,
        title: "kroni bola",
        note: "kuala lumpur",
        card: {
          number: 10,
          position: "cdm",
          stats: [
            { label: "games", value: "4" },
            { label: "goals", value: "8" },
            { label: "assists", value: "5" },
          ],
          foil: "prism",
        },
      },
      {
        id: 3,
        title: "national school of physics & mathematics",
        card: {
          number: 2,
          position: "st",
          stats: [
            { label: "games", value: "—" },
            { label: "goals", value: "—" },
            { label: "assists", value: "1" },
          ],
          honour: "2nd place, national tournament",
          foil: "cosmos",
        },
      },
    ],
  },
  {
    id: "airplanes",
    title: "airplanes",
    entries: [
      {
        id: 1,
        title: "concorde",
        note: "mach 2.04",
        meta: "1969",
        preview: "/planes/concorde.jpg",
        images: ["/planes/concorde.jpg"],
        body: [
          "eleven miles up, going twice the speed of sound, the sky above you turns properly dark and you can see the curve of the earth. the airframe grew about 25 centimetres in flight from the heat, so there was a gap by the flight engineer's panel that only closed at cruise.",
          "it's the only time i can think of that we got something working and then decided to go slower. nothing has replaced it and nothing is going to for a while.",
        ],
        credit: "photo: eduard marmet · cc by-sa 3.0",
      },
      {
        id: 2,
        title: "tu-144",
        note: "mach 2.15",
        meta: "1968",
        preview: "/planes/tu-144.jpg",
        images: ["/planes/tu-144.jpg"],
        body: [
          "beat concorde into the air by two months and never once beat it at anything else. the little canards that swing out behind the cockpit are the tell — they had to bolt them on to make it land properly.",
          "fifty-five passenger flights in total, and one of the loudest cabins ever built. the sad one: first, and never right.",
        ],
        credit: "photo: clipperarctic · cc by-sa 2.0",
      },
      {
        id: 9,
        title: "sr-71",
        note: "mach 3.3",
        meta: "1964",
        preview: "/planes/sr-71.jpg",
        images: ["/planes/sr-71.jpg"],
        body: [
          "the panels were deliberately fitted loose, so it sat on the runway leaking fuel and only sealed itself once friction heated the airframe enough to close the gaps. the titanium came, via front companies, from the soviet union.",
          "the standard response to a surface-to-air missile was to accelerate. not one was ever lost to enemy fire. los angeles to washington in 64 minutes, in 1990, and that record still stands.",
        ],
        credit: "photo: usaf / judson brohmer · public domain",
      },
      {
        id: 3,
        title: "a340-600",
        note: "mach 0.86",
        meta: "2001",
        preview: "/planes/a340-600.jpg",
        images: ["/planes/a340-600.jpg"],
        body: [
          "the longest airliner in the world when it launched, and famously short of thrust — the old joke is that it doesn't rotate, the earth just curves away beneath it. four engines under a 75-metre tube is a thing that isn't coming back.",
        ],
        credit: "photo: adrian pingstone · public domain",
      },
      {
        id: 4,
        title: "787",
        note: "mach 0.85",
        meta: "2009",
        preview: "/planes/787.jpg",
        images: ["/planes/787.jpg"],
        body: [
          "the first airliner with a carbon fibre fuselage, which is the whole reason the cabin can hold more humidity and sit at a lower altitude than anything before it. you get off a fourteen-hour flight less wrecked. and the wing flexes like it's alive.",
        ],
        credit: "photo: pjs2005 · cc by-sa 2.0",
      },
      {
        id: 5,
        title: "a350",
        note: "mach 0.85",
        meta: "2013",
        preview: "/planes/a350.jpg",
        images: ["/planes/a350.jpg"],
        body: [
          "the dark mask around the cockpit windows is one of the very few times an airliner has been given a face on purpose, and it works. quietest cabin flying.",
        ],
        credit: "photo: steve lynes · cc by 2.0",
      },
      {
        id: 6,
        title: "f-22",
        note: "mach 2.25",
        meta: "1997",
        preview: "/planes/f22.jpg",
        images: ["/planes/f22.jpg"],
        body: [
          "supercruise — supersonic without lighting the afterburner — plus thrust vectoring, so it can point somewhere other than where it's going. nearly thirty years old and still nothing has caught it.",
        ],
        credit: "photo: msgt andy dunaway, usaf · public domain",
      },
      {
        id: 7,
        title: "su-57",
        note: "mach 2.0",
        meta: "2010",
        preview: "/planes/su57.jpg",
        images: ["/planes/su57.jpg"],
        body: [
          "the opposite bet to the raptor: agility first, stealth second. watching one hold a flat spin at an airshow is watching someone argue with physics and win.",
        ],
        credit: "photo: anna zvereva · cc by-sa 2.0",
      },
      {
        id: 8,
        title: "777",
        note: "mach 0.84",
        meta: "1994",
        preview: "/planes/777.jpg",
        images: ["/planes/777.jpg"],
        body: [
          "the ge90 hanging off it is the most powerful jet engine ever built, with a fan close to the width of a 737's fuselage. first commercial aircraft designed entirely on a computer, and still the thing doing most of the world's long-haul heavy lifting.",
        ],
        credit: "photo: aero icarus · cc by-sa 2.0",
      },
    ],
  },
];
