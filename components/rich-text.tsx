import type { ReactNode } from "react";

/**
 * The tiny markup language the content file is written in.
 *
 * Two things only, because two is what the content actually needs and every
 * further rule is another thing to remember at 1am:
 *
 *   [label](https://url)   a link
 *   :key:                  an inline logo, from the LOGOS map below
 *
 * Links use markdown's shape rather than `label[url]`. In `i was cto at
 * amurex[url]` there is no way to know whether the link is "amurex" or the
 * whole phrase, so multi-word labels — "air street", "product hunt" — become
 * impossible. Naming both halves costs two brackets and removes the guess.
 *
 * Anything that doesn't match is left exactly as typed, so an ordinary
 * sentence needs no escaping and a stray bracket is just a bracket.
 */

/**
 * Inline logos, keyed by whatever you type between the colons.
 *
 * Keys may contain spaces — write the company the way you'd say it. Several
 * keys can point at one file, so a thing with more than one name doesn't need
 * you to remember which one you picked.
 */
type Logo = string | { src: string; em: number };

export const LOGOS: Record<string, Logo> = {
  "bay cloud": "/logos/bay.svg",
  bay: "/logos/bay.svg",
  speko: "/logos/speko.svg",
  "speko ai": "/logos/speko.svg",
  yc: "/logos/yc.svg",
  "y combinator": "/logos/yc.svg",
  omi: "/logos/omi.png",
  delfa: "/logos/delfa.svg",
  amurex: "/logos/amurex.png",
  "the personal ai company": "/logos/amurex.png",
  github: "/logos/github.svg",
  x: "/logos/x.png",
  linkedin: "/logos/linkedin.ico",
  producthunt: "/logos/producthunt.png",
  "product hunt": "/logos/producthunt.png",
  ef: "/logos/ef.jpg",
  "entrepreneur first": "/logos/ef.jpg",

  // Wide marks need their own height. A badge is 4.5:1, so at the square
  // default its text renders at about 6px and can't be read — the number is
  // the entire point of it.
  "amurex stars": { src: "/logos/amurex-stars.svg", em: 1.5 },
};

/** Square marks sit at 0.9em; anything wider says so. */
function logoSize(logo: Logo): { src: string; em: number } {
  return typeof logo === "string" ? { src: logo, em: 0.9 } : logo;
}

export function RichText({ text }: { text: string }) {
  // Built per call rather than hoisted: a /g regex carries lastIndex, and a
  // shared one would let two components interleave mid-scan under concurrent
  // rendering and drop half a paragraph.
  // Logo keys allow spaces, so "the personal ai company" works. That makes
  // false matches possible in ordinary prose ("note: see this: ok"), which is
  // handled two ways: the key must START with a letter or digit, ruling out
  // the common "colon-space" case, and any key not in LOGOS falls through to
  // the literal text below — so a wrong guess costs nothing.
  const token = /\[([^\]]+)\]\(([^)\s]+)\)|:([a-z0-9][a-z0-9 ._-]{0,39}):/g;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = token.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

    const [, label, href, logo] = match;

    if (href) {
      nodes.push(
        <a
          key={`${match.index}-a`}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          className="text-ink underline decoration-ink/25 underline-offset-4 transition-colors duration-150 hover:decoration-ink"
        >
          {/* Parsed again so a label can hold a logo — which is how a badge
              becomes clickable, the way it behaves on github. Recursion is
              one level deep by construction: a label can't contain "]", so it
              can't contain another link. */}
          <RichText text={label} />
        </a>,
      );
    } else if (logo) {
      const entry = LOGOS[logo];
      // An unknown key stays visible as `:typo:` rather than vanishing —
      // a silent failure here is a logo you never notice is missing.
      if (!entry) {
        nodes.push(match[0]);
      } else {
        const { src, em } = logoSize(entry);
        nodes.push(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${match.index}-l`}
            src={src}
            alt=""
            // Sized in em so it tracks whatever type it sits in.
            //
            // align-middle, not align-baseline. Baseline puts the whole box
            // above the baseline, so a ~1em mark floats past the cap height
            // of the words beside it. `vertical-align: middle` centres the box
            // on the parent's x-height — which is the right reference here,
            // since the site is entirely lowercase and its optical mass sits
            // at x-height, not cap height.
            style={{ height: `${em}em` }}
            className="mx-[0.18em] inline-block w-auto rounded-[3px] align-middle"
          />,
        );
      }
    }

    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <>{nodes}</>;
}
